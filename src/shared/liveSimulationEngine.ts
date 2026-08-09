import { anomalyEngine } from '../background/isolationForest/anomalyScorer';
import { InterceptedRequest, RiskEvaluation, ApprovalItem } from './types';
import { getItem, setItem } from './storage';

let simulationTimer: any = null;
let isSimulationActive = false;

const SAMPLE_DOMAINS = [
  'app.uniswap.org',
  'opensea.io',
  'claim-airdrop-eth.xyz',
  'aave.com',
  'openseaa.io',
  'blur.io',
  'free-nft-mint.live'
];

const SAMPLE_CONTRACTS = [
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45', // Uniswap Router
  '0x000000000022d473030f116ddee9f6b43ac78ba3', // Permit2
  '0x00001a4b988f01c897321a002931a0293810293', // Unverified malicious contract
  '0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b', // Universal Router
  '0x9999999999999999999999999999999999999999'  // Scam drainer
];

export function startLiveSimulationStream(intervalMs: number = 4000): void {
  if (isSimulationActive) return;
  isSimulationActive = true;
  console.log('🔴 [Live Simulator] Starting real-time Web3 security telemetry stream...');

  simulationTimer = setInterval(async () => {
    try {
      const simulatedReq = generateRandomInterceptedRequest();
      const evaluation = anomalyEngine.evaluateRequest(simulatedReq);

      // Get existing evaluations from storage
      const existing = (await getItem<RiskEvaluation[]>('recentEvaluations')) || [];
      const updatedList = [evaluation, ...existing];
      if (updatedList.length > 50) updatedList.pop();

      // Persist to local storage (triggers real-time UI listeners across all components!)
      await setItem('recentEvaluations', updatedList);

      // Also dynamically update active approvals occasionally
      if (Math.random() > 0.6) {
        await updateDynamicApprovals();
      }

      console.log(`📡 [Live Telemetry Stream] Evaluated ${simulatedReq.type} on ${simulatedReq.originDomain} - Risk Score: ${evaluation.riskScore}% (${evaluation.riskLevel})`);
    } catch (e) {
      console.warn('[Live Simulator] Stream generation warning:', e);
    }
  }, intervalMs);
}

export function stopLiveSimulationStream(): void {
  if (simulationTimer) {
    clearInterval(simulationTimer);
    simulationTimer = null;
  }
  isSimulationActive = false;
  console.log('⏹️ [Live Simulator] Telemetry stream stopped.');
}

export function isSimulationRunning(): boolean {
  return isSimulationActive;
}

function generateRandomInterceptedRequest(): InterceptedRequest {
  const domain = SAMPLE_DOMAINS[Math.floor(Math.random() * SAMPLE_DOMAINS.length)];
  const contract = SAMPLE_CONTRACTS[Math.floor(Math.random() * SAMPLE_CONTRACTS.length)];
  const isDrainer = domain.includes('claim') || domain.includes('free') || domain.includes('aa.io') || contract.startsWith('0x00001');
  const isHighGas = Math.random() > 0.7;

  const randId = 'tx_0x' + Math.random().toString(16).substring(2, 10);
  
  let method = 'eth_sendTransaction';
  let dataHex = '0x38ed1739000000000000000000000000';
  let valueHex = '0x' + Math.floor(Math.random() * 5e17).toString(16); // Up to 0.5 ETH

  if (isDrainer) {
    method = Math.random() > 0.5 ? 'eth_sendTransaction' : 'eth_signTypedData_v4';
    // ERC20 unlimited approval
    dataHex = '0x095ea7b30000000000000000000000000000000000000000000000000000000000000001ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  }

  const txObj: any = {
    from: '0x16b779594d7b2c9594d',
    to: contract,
    value: valueHex,
    data: dataHex
  };

  if (isHighGas) {
    txObj.maxPriorityFeePerGas = '0x165a0bc00'; // High priority gas fee
  }

  return {
    id: randId,
    type: method as any,
    rawPayload: {
      method,
      params: [txObj]
    },
    originDomain: domain,
    timestamp: Date.now()
  };
}

async function updateDynamicApprovals(): Promise<void> {
  const current = (await getItem<ApprovalItem[]>('activeApprovals')) || [];
  if (current.length === 0) return;

  // Modifies last updated timestamp or simulated allowance live
  const randomIndex = Math.floor(Math.random() * current.length);
  const updated = [...current];
  updated[randomIndex] = {
    ...updated[randomIndex],
    lastUpdated: 'Just now'
  };

  await setItem('activeApprovals', updated);
}
