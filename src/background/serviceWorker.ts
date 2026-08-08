import { anomalyEngine } from './isolationForest/anomalyScorer';
import { InterceptedRequest, RiskEvaluation, ExtensionSettings } from '../shared/types';

console.log('👁️ [Third Eye] Background Service Worker initialized.');

const DEFAULT_SETTINGS: ExtensionSettings = {
  autoBlockDrainers: true,
  enableAiExplanation: true,
  customBackendUrl: 'http://localhost:8000',
  whitelistedDomains: ['uniswap.org', 'opensea.io', 'aave.com'],
  phishingBlockList: ['openseaa.io', 'claim-airdrop-eth.xyz']
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['thirdEyeSettings'], (result) => {
    if (!result.thirdEyeSettings) {
      chrome.storage.local.set({ thirdEyeSettings: DEFAULT_SETTINGS });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EVALUATE_TRANSACTION') {
    handleTransactionEvaluation(message.payload)
      .then((evaluation) => sendResponse({ success: true, evaluation }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'GET_RECENT_EVALUATIONS') {
    chrome.storage.local.get(['recentEvaluations'], (res) => {
      sendResponse({ evaluations: res.recentEvaluations || [] });
    });
    return true;
  }

  if (message.type === 'GET_APPROVALS') {
    chrome.storage.local.get(['activeApprovals'], (res) => {
      sendResponse({ approvals: res.activeApprovals || [] });
    });
    return true;
  }

  if (message.type === 'REVOKE_APPROVAL') {
    handleRevokeApproval(message.approvalId)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function handleTransactionEvaluation(req: InterceptedRequest): Promise<RiskEvaluation> {
  console.log(`👁️ [Third Eye] Background evaluating ${req.id} (${req.type}) dynamically.`);

  // 1. Run Isolation Forest Anomaly Engine dynamically
  const evaluation = anomalyEngine.evaluateRequest(req);

  // 2. Query Python FastAPI Microservice if online
  try {
    const settings = await getSettings();
    if (settings.customBackendUrl) {
      const resp = await fetch(`${settings.customBackendUrl}/api/v1/analyze-tx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: req, localEvaluation: evaluation })
      });
      if (resp.ok) {
        const backendResult = await resp.json();
        if (backendResult.aiExplanation) {
          evaluation.aiExplanation = backendResult.aiExplanation;
          evaluation.plainEnglishWhy = backendResult.aiExplanation;
        }
      }
    }
  } catch (e) {
    console.log('ℹ️ Local Isolation Forest engine used (Backend offline).');
  }

  // 3. Dynamically update chrome.storage.local (Triggers real-time popup listeners!)
  chrome.storage.local.get(['recentEvaluations'], (res) => {
    const list: RiskEvaluation[] = res.recentEvaluations || [];
    list.unshift(evaluation);
    if (list.length > 50) list.pop();
    chrome.storage.local.set({ recentEvaluations: list }, () => {
      console.log('💾 Dynamically updated recentEvaluations in local storage.');
    });
  });

  return evaluation;
}

async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['thirdEyeSettings'], (res) => {
      resolve(res.thirdEyeSettings || DEFAULT_SETTINGS);
    });
  });
}

async function handleRevokeApproval(approvalId: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['activeApprovals'], (res) => {
      const list = res.activeApprovals || [];
      const updated = list.filter((item: any) => item.id !== approvalId);
      chrome.storage.local.set({ activeApprovals: updated }, () => resolve());
    });
  });
}
