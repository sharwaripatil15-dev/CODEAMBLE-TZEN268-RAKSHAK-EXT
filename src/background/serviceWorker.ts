import { anomalyEngine } from './isolationForest/anomalyScorer';
import { InterceptedRequest, RiskEvaluation, ExtensionSettings } from '../shared/types';
import { getItem, setItem } from '../shared/storage';

console.log('👁️ [Third Eye] Background Service Worker initialized.');

const DEFAULT_SETTINGS: ExtensionSettings = {
  autoBlockDrainers: true,
  enableAiExplanation: true,
  customBackendUrl: 'http://localhost:8000',
  whitelistedDomains: ['uniswap.org', 'opensea.io', 'aave.com'],
  phishingBlockList: ['openseaa.io', 'claim-airdrop-eth.xyz']
};

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener(async () => {
    const existing = await getItem<ExtensionSettings>('thirdEyeSettings');
    if (!existing) {
      await setItem('thirdEyeSettings', DEFAULT_SETTINGS);
    }
  });
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EVALUATE_TRANSACTION') {
      handleTransactionEvaluation(message.payload)
        .then((evaluation) => sendResponse({ success: true, evaluation }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }

    if (message.type === 'GET_RECENT_EVALUATIONS') {
      getItem<RiskEvaluation[]>('recentEvaluations', []).then((evaluations) => {
        sendResponse({ evaluations });
      });
      return true;
    }

    if (message.type === 'GET_APPROVALS') {
      getItem<any[]>('activeApprovals', []).then((approvals) => {
        sendResponse({ approvals });
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
}

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

  // 3. Dynamically update local storage (Triggers real-time listeners!)
  const list = (await getItem<RiskEvaluation[]>('recentEvaluations')) || [];
  list.unshift(evaluation);
  if (list.length > 50) list.pop();
  await setItem('recentEvaluations', list);
  console.log('💾 Dynamically updated recentEvaluations in local storage.');

  return evaluation;
}

async function getSettings(): Promise<ExtensionSettings> {
  const settings = await getItem<ExtensionSettings>('thirdEyeSettings');
  return settings || DEFAULT_SETTINGS;
}

async function handleRevokeApproval(approvalId: string): Promise<void> {
  const list = (await getItem<any[]>('activeApprovals')) || [];
  const updated = list.filter((item: any) => item.id !== approvalId);
  await setItem('activeApprovals', updated);
}

