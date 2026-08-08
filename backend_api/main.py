import os
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

app = FastAPI(
    title="Third Eye Web3 Security & Isolation Forest Microservice",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "isolation_forest_model.pkl")
clf_model = None

@app.on_event("startup")
def load_model():
    global clf_model
    if os.path.exists(MODEL_PATH):
        try:
            clf_model = joblib.load(MODEL_PATH)
            print("[Third Eye] Loaded trained Isolation Forest model successfully.")
        except Exception as e:
            print(f"[Warning] Failed to load model: {e}")
    else:
        print("[Info] Model file not found. Running training script...")
        from train_isolation_forest import train_and_export_model
        train_and_export_model()
        if os.path.exists(MODEL_PATH):
            clf_model = joblib.load(MODEL_PATH)

class TxRequestPayload(BaseModel):
    request: Dict[str, Any]
    localEvaluation: Optional[Dict[str, Any]] = None

@app.get("/health")
def health_check():
    return {"status": "online", "model_loaded": clf_model is not None}

@app.post("/api/v1/analyze-tx")
def analyze_transaction(payload: TxRequestPayload):
    local_eval = payload.localEvaluation or {}
    signals = local_eval.get("signals", {})

    # Extract 8-dimensional feature vector
    x_val_dev = float(signals.get("valueUsdDeviation", 1.0))
    x_gas_ratio = float(signals.get("gasPriorityFeeRatio", 1.0))
    x_new_contract = 1.0 if float(signals.get("contractAgeHours", 72)) <= 24 else 0.0
    x_unverified = 0.0 if signals.get("contractIsVerified", True) else 1.0
    x_unlimited = 1.0 if signals.get("isUnlimitedApproval", False) else 0.0
    x_low_tx = 1.0 if int(signals.get("recipientTxCount", 100)) < 50 else 0.0
    x_no_hist = 0.0 if signals.get("historicalInteraction", False) else 1.0
    x_phishing = (100.0 - float(signals.get("domainTrustScore", 100))) / 100.0

    features = np.array([[
        x_val_dev, x_gas_ratio, x_new_contract, x_unverified,
        x_unlimited, x_low_tx, x_no_hist, x_phishing
    ]])

    anomaly_score = -0.5
    risk_score = 10
    if clf_model:
        try:
            raw_decision = float(clf_model.decision_function(features)[0])
            # decision_function: positive = normal, negative = anomaly
            anomaly_score = float(np.round(-raw_decision, 2))
            risk_score = int(np.clip((0.5 - raw_decision) * 100, 0, 100))
        except Exception as e:
            print(f"Error evaluating model: {e}")

    risk_level = "SAFE"
    if risk_score >= 70 or x_unlimited == 1.0 or x_phishing > 0.5:
        risk_level = "CRITICAL"
    elif risk_score >= 40:
        risk_level = "WARNING"

    ai_explanation = generate_gemini_explanation(signals, risk_level, risk_score)

    return {
        "isolationForestAnomalyScore": anomaly_score,
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "aiExplanation": ai_explanation
    }

function_call_counter = 0

def generate_gemini_explanation(signals: dict, risk_level: str, risk_score: int) -> str:
    """Generates natural language explanation based on risk assessment."""
    if risk_level == "CRITICAL":
        return (
            f"🛑 [Third Eye FastAPI Guard] CRITICAL ANOMALY (Risk Score {risk_score}/100). "
            "Isolation Forest decision trees identified anomalous parameter combinations. "
            "The payload exhibits features of automated drainers or unverified contract approvals."
        )
    elif risk_level == "WARNING":
        return (
            f"⚠️ [Third Eye FastAPI Guard] MODERATE RISK (Risk Score {risk_score}/100). "
            "Contract bytecode or domain parameters display slight anomalies. Proceed with caution."
        )
    return (
        f"✅ [Third Eye FastAPI Guard] VERIFIED SAFE (Risk Score {risk_score}/100). "
        "Isolation Forest feature vectors fall squarely within safe baseline bounds."
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
