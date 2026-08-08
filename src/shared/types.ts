export type TxType = 'ETH_SEND_TX' | 'ETH_SIGN_TYPED_DATA' | 'PERSONAL_SIGN' | 'ETH_SIGN';

export interface InterceptedRequest {
  id: string;
  type: TxType;
  rawPayload: any;
  originDomain: string;
  timestamp: number;
}

export interface WalletConnection {
  address: string;
  label: string; // e.g. "Uniswap V3 Router", "Known Scam Wallet", "Binance Hot Wallet", "You"
  category: 'EXCHANGE' | 'SCAM' | 'DAPP' | 'USER' | 'UNLABELED';
  icon: string;
  lastInteraction: string;
}

export interface IsolationForestSignals {
  valueUsd: number;
  valueUsdDeviation: number;
  gasPriorityFeeRatio: number;
  contractAgeHours: number;
  contractIsVerified: boolean;
  isUnlimitedApproval: boolean;
  recipientTxCount: number;
  historicalInteraction: boolean;
  domainTrustScore: number;
}

export interface NetAssetChange {
  asset: string;
  amount: string;
  type: 'IN' | 'OUT' | 'APPROVAL';
}

export interface RiskEvaluation {
  txId: string;
  riskScore: number; // 0 to 100
  isolationForestAnomalyScore: number; // -1 to +1
  riskLevel: 'SAFE' | 'CAUTION' | 'HIGH_RISK' | 'WARNING' | 'CRITICAL';
  oneSentenceSummary: string; // "One score, one sentence" rule
  plainEnglishWhy: string;
  actionableSafetyTip: string;
  exploitCategoryPlain: string; // e.g. "Front-running / Sandwich activity" instead of "sandwich_attack"
  communityFlagged: boolean;
  connectedWallets: WalletConnection[]; // Top 5-10 labeled connections list
  technicalDetails: {
    rawScore: number;
    isolationTreePath: string;
    rawPayload: string;
  };
  signals: IsolationForestSignals;
  reasons: string[];
  aiExplanation: string;
  netAssetChanges: NetAssetChange[];
  interceptedAt: number;
}

export interface ApprovalItem {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  spenderAddress: string;
  spenderName: string;
  allowance: string;
  riskLevel: 'SAFE' | 'HIGH' | 'CRITICAL';
  lastUpdated: string;
}

export interface ExtensionSettings {
  autoBlockDrainers: boolean;
  enableAiExplanation: boolean;
  customBackendUrl: string;
  whitelistedDomains: string[];
  phishingBlockList: string[];
}
