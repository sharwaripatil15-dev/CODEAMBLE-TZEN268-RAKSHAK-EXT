"""
Third Eye - Isolation Forest Training Script for Web3 Anomaly Detection
Trains scikit-learn IsolationForest on single-transaction feature vectors.
"""

import os
import json
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib

def generate_synthetic_tx_dataset(num_samples=2000):
    """
    Generates synthetic dataset of Web3 transactions:
    Features X:
    0: tx_value_usd_deviation (1.0 = normal, 10.0+ = extreme spike)
    1: gas_priority_fee_ratio (1.0 = normal, 5.0+ = aggressive priority fee)
    2: is_new_contract (1 = age < 24h, 0 = old contract)
    3: is_unverified_contract (1 = unverified, 0 = verified)
    4: is_unlimited_approval (1 = approval unlimited / permit, 0 = standard transfer)
    5: recipient_low_tx_count (1 = tx count < 50, 0 = active contract)
    6: no_historical_interaction (1 = first interaction, 0 = previous interaction)
    7: domain_distrust_index (0.0 = trusted domain like Uniswap, 1.0 = phishing domain)
    """
    np.random.seed(42)

    # 90% normal transactions
    num_normal = int(num_samples * 0.90)
    normal_x0 = np.random.exponential(scale=1.2, size=num_normal) # value deviation
    normal_x1 = np.random.normal(loc=1.0, scale=0.3, size=num_normal) # gas ratio
    normal_x2 = np.random.binomial(n=1, p=0.05, size=num_normal) # new contract
    normal_x3 = np.random.binomial(n=1, p=0.02, size=num_normal) # unverified
    normal_x4 = np.random.binomial(n=1, p=0.10, size=num_normal) # unlimited approval
    normal_x5 = np.random.binomial(n=1, p=0.05, size=num_normal) # low tx count
    normal_x6 = np.random.binomial(n=1, p=0.30, size=num_normal) # no history
    normal_x7 = np.random.uniform(0.0, 0.25, size=num_normal) # trusted domain

    X_normal = np.column_stack([
        normal_x0, normal_x1, normal_x2, normal_x3,
        normal_x4, normal_x5, normal_x6, normal_x7
    ])

    # 10% malicious / anomalous transactions (wallet drainers, phishing approvals)
    num_anomaly = num_samples - num_normal
    anomaly_x0 = np.random.uniform(3.0, 15.0, size=num_anomaly)
    anomaly_x1 = np.random.uniform(2.5, 8.0, size=num_anomaly)
    anomaly_x2 = np.random.binomial(n=1, p=0.85, size=num_anomaly)
    anomaly_x3 = np.random.binomial(n=1, p=0.80, size=num_anomaly)
    anomaly_x4 = np.random.binomial(n=1, p=0.90, size=num_anomaly)
    anomaly_x5 = np.random.binomial(n=1, p=0.95, size=num_anomaly)
    anomaly_x6 = np.random.binomial(n=1, p=0.90, size=num_anomaly)
    anomaly_x7 = np.random.uniform(0.6, 1.0, size=num_anomaly)

    X_anomaly = np.column_stack([
        anomaly_x0, anomaly_x1, anomaly_x2, anomaly_x3,
        anomaly_x4, anomaly_x5, anomaly_x6, anomaly_x7
    ])

    X = np.vstack([X_normal, X_anomaly])
    return X

def train_and_export_model():
    print("[Third Eye] Generating Web3 transaction dataset for Isolation Forest training...")
    X = generate_synthetic_tx_dataset()

    print("[Third Eye] Training scikit-learn IsolationForest model...")
    clf = IsolationForest(
        n_estimators=100,
        max_samples=256,
        contamination=0.10,
        random_state=42
    )
    clf.fit(X)

    # Evaluate test samples
    normal_sample = np.array([[1.0, 1.0, 0, 0, 0, 0, 0, 0.0]])
    scam_sample = np.array([[8.5, 4.2, 1, 1, 1, 1, 1, 0.9]])

    normal_score = clf.decision_function(normal_sample)[0]
    scam_score = clf.decision_function(scam_sample)[0]

    print(f"[OK] Normal Sample Score: {normal_score:.4f} (Higher = Normal)")
    print(f"[ALERT] Scam Sample Score:   {scam_score:.4f} (Lower/Negative = Anomaly)")

    model_dir = os.path.dirname(__file__)
    model_path = os.path.join(model_dir, "isolation_forest_model.pkl")
    joblib.dump(clf, model_path)
    print(f"[SAVED] Model saved to {model_path}")

if __name__ == "__main__":
    train_and_export_model()
