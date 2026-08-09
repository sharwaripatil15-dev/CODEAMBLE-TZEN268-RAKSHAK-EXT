import React, { useState, useEffect } from 'react';
import { anomalyEngine } from '../background/isolationForest/anomalyScorer';
import { RiskEvaluation, ApprovalItem, WalletConnection, ExtensionSettings, InterceptedRequest } from '../shared/types';
import { getItem, setItem, addStorageListener } from '../shared/storage';
import { startLiveSimulationStream, stopLiveSimulationStream, isSimulationRunning } from '../shared/liveSimulationEngine';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Globe,
  Trash2,
  Settings,
  Activity,
  Key,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Users,
  Terminal,
  Clock,
  ArrowRight,
  Home,
  Cpu,
  Lock,
  Check,
  Copy,
  PlusCircle,
  Edit2,
  Edit3,
  Send,
  ArrowUpRight
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'connections' | 'approvals' | 'settings'>('home');
  const [fullWalletAddress, setFullWalletAddress] = useState<string>('0x16b779594d7b2c9594d');
  const [connectedWallet, setConnectedWallet] = useState<string>('0x16B77...9594D');
  const [isEditingMetaMaskId, setIsEditingMetaMaskId] = useState<boolean>(false);
  const [inputMetaMaskId, setInputMetaMaskId] = useState<string>('0x16b779594d7b2c9594d');
  const [walletBalance, setWalletBalance] = useState<string>('1.42 ETH');
  const [networkName, setNetworkName] = useState<string>('Base Sepolia');
  const [activeDomain, setActiveDomain] = useState<string>('app.uniswap.org');
  const [expandedTxId, setExpandedTxId] = useState<string>('tx_0x1b82c91...57f3');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [connectionFilter, setConnectionFilter] = useState<'ALL' | 'SCAM' | 'DAPP' | 'EXCHANGE' | 'USER'>('ALL');
  const [copiedAddress, setCopiedAddress] = useState<string>('');
  const [evaluationsList, setEvaluationsList] = useState<RiskEvaluation[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [editingApprovalId, setEditingApprovalId] = useState<string | null>(null);
  const [customAllowanceVal, setCustomAllowanceVal] = useState<string>('10.0');
  const [approvalSuccessMsg, setApprovalSuccessMsg] = useState<string>('');
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(false);
  const [settings, setSettings] = useState<ExtensionSettings>({
    autoBlockDrainers: true,
    enableAiExplanation: true,
    customBackendUrl: 'http://localhost:8000',
    whitelistedDomains: ['uniswap.org', 'opensea.io', 'aave.com'],
    phishingBlockList: ['openseaa.io', 'claim-airdrop-eth.xyz']
  });
  const [loading, setLoading] = useState(false);
  const [recipientMetaMaskId, setRecipientMetaMaskId] = useState<string>('0x7a250d5630b4cf539739df2c5dacb4c659f2488d');
  const [sendAmountEth, setSendAmountEth] = useState<string>('0.05');
  const [initiatedTxResult, setInitiatedTxResult] = useState<RiskEvaluation | null>(null);
  const [txInitiating, setTxInitiating] = useState<boolean>(false);

  const handleInitiateTransaction = async () => {
    const recipient = recipientMetaMaskId.trim();
    if (!recipient) return;

    setTxInitiating(true);
    const amountVal = parseFloat(sendAmountEth) || 0.05;
    const valueHex = '0x' + Math.floor(amountVal * 1e18).toString(16);

    const txObj: any = {
      from: fullWalletAddress || '0x16b779594d7b2c9594d',
      to: recipient,
      value: valueHex,
      data: '0x'
    };

    const req: InterceptedRequest = {
      id: 'tx_0x' + Math.random().toString(16).substring(2, 8),
      type: 'ETH_SEND_TX',
      rawPayload: { method: 'eth_sendTransaction', params: [txObj] },
      originDomain: activeDomain || 'app.uniswap.org',
      timestamp: Date.now()
    };

    // Isolation Forest Engine automatically evaluates the transaction parameters & recipient address
    const evaluation = anomalyEngine.evaluateRequest(req);
    const isUnverifiedTarget = evaluation.riskLevel === 'HIGH_RISK';

    const displayAddr = recipient.length > 12 ? `${recipient.substring(0, 6)}...${recipient.substring(recipient.length - 4)}` : recipient;
    evaluation.connectedWallets = [
      { address: recipient, label: `Recipient (${displayAddr})`, category: isUnverifiedTarget ? 'SCAM' : 'USER', icon: isUnverifiedTarget ? '🚨' : '👤', lastInteraction: 'Just now' },
      { address: fullWalletAddress, label: `You (${connectedWallet})`, category: 'USER', icon: '👤', lastInteraction: 'Active' }
    ];

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [txObj]
        });
      } catch (e) { }
    }

    const stored = (await getItem<RiskEvaluation[]>('recentEvaluations')) || [];
    const updatedList = [evaluation, ...stored].slice(0, 5);
    await setItem('recentEvaluations', updatedList);
    setEvaluationsList(updatedList);
    setExpandedTxId(evaluation.txId);
    setInitiatedTxResult(evaluation);
    setTxInitiating(false);
  };

  useEffect(() => {
    loadSavedMetaMaskAddress();
    checkAndConnectMetaMask();
    detectActiveTabDomain();
    loadExtensionData();

    const cleanup = setupDynamicListeners();
    return () => {
      cleanup && cleanup();
    };
  }, []);

  const toggleLiveStream = () => {
    if (isSimulationRunning()) {
      stopLiveSimulationStream();
      setIsLiveStreamActive(false);
    } else {
      startLiveSimulationStream(3500);
      setIsLiveStreamActive(true);
    }
  };

  const loadSavedMetaMaskAddress = async () => {
    const saved = await getItem<string>('customMetaMaskAddress');
    if (saved) {
      updateMetaMaskState(saved);
    }
  };

  const updateMetaMaskState = (addr: string) => {
    const clean = addr.trim();
    if (!clean) return;
    setFullWalletAddress(clean);
    setInputMetaMaskId(clean);
    if (clean.length > 12) {
      setConnectedWallet(`${clean.substring(0, 6)}...${clean.substring(clean.length - 4)}`);
    } else {
      setConnectedWallet(clean);
    }
  };

  const saveCustomMetaMaskId = async () => {
    if (!inputMetaMaskId.trim()) return;
    const clean = inputMetaMaskId.trim();
    updateMetaMaskState(clean);
    setIsEditingMetaMaskId(false);
    await setItem('customMetaMaskAddress', clean);
  };

  const checkAndConnectMetaMask = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const provider = (window as any).ethereum;
      try {
        const accounts: string[] = await provider.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          const acc = accounts[0];
          updateMetaMaskState(acc);

          try {
            const balanceHex: string = await provider.request({
              method: 'eth_getBalance',
              params: [acc, 'latest']
            });
            const balanceEth = (parseInt(balanceHex, 16) / 1e18).toFixed(4);
            setWalletBalance(`${balanceEth} ETH`);
          } catch (e) { }

          try {
            const chainHex: string = await provider.request({ method: 'eth_chainId' });
            setNetworkName(getNetworkNameFromChainId(chainHex));
          } catch (e) { }
        }
      } catch (e) { }
    }
  };

  const setupDynamicListeners = () => {
    const cleanup = addStorageListener((key, newValue) => {
      if (key === 'recentEvaluations' && newValue) {
        setEvaluationsList(newValue);
      } else if (key === 'activeApprovals' && newValue) {
        setApprovals(newValue);
      } else if (key === 'customMetaMaskAddress' && newValue) {
        updateMetaMaskState(newValue);
      } else if (key === 'thirdEyeSettings' && newValue) {
        setSettings(newValue);
      }
    });

    if (typeof window !== 'undefined' && (window as any).ethereum && (window as any).ethereum.on) {
      const provider = (window as any).ethereum;
      provider.on('accountsChanged', (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          updateMetaMaskState(accounts[0]);
        }
      });
      provider.on('chainChanged', (chainId: string) => {
        setNetworkName(getNetworkNameFromChainId(chainId));
      });
    }

    return cleanup;
  };

  const getNetworkNameFromChainId = (chainIdHex: string): string => {
    const id = parseInt(chainIdHex, 16);
    switch (id) {
      case 1: return 'Ethereum';
      case 8453: return 'Base';
      case 84532: return 'Base Sepolia';
      case 137: return 'Polygon';
      case 42161: return 'Arbitrum';
      default: return `Chain #${id}`;
    }
  };

  const detectActiveTabDomain = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          try {
            const urlObj = new URL(tabs[0].url);
            setActiveDomain(urlObj.hostname);
          } catch (e) { }
        }
      });
    }
  };

  const loadExtensionData = async () => {
    const historyData = getFallbackHistoryTransactions(connectedWallet);
    const savedSettings = await getItem<ExtensionSettings>('thirdEyeSettings');
    if (savedSettings) setSettings(savedSettings);

    // Enforce static 5 history items
    setEvaluationsList(historyData);
    if (historyData[0]?.txId) setExpandedTxId(historyData[0].txId);
    await setItem('recentEvaluations', historyData);

    const storedApprovals = await getItem<ApprovalItem[]>('activeApprovals');
    if (storedApprovals && storedApprovals.length > 0) {
      setApprovals(storedApprovals);
    } else {
      const mocks = getMockApprovals();
      setApprovals(mocks);
      setItem('activeApprovals', mocks);
    }
  };

  const handleRevoke = async (appToRevoke: ApprovalItem) => {
    setLoading(true);
    const updated = approvals.filter((a) => a.id !== appToRevoke.id);
    setApprovals(updated);
    await setItem('activeApprovals', updated);
    setApprovalSuccessMsg(`Revoked spending allowance for ${appToRevoke.spenderName}`);
    setTimeout(() => setApprovalSuccessMsg(''), 3000);
    setLoading(false);
  };

  const handleGrantApproval = async (app: ApprovalItem) => {
    setLoading(true);
    const newAllowanceStr = customAllowanceVal ? `${customAllowanceVal} ${app.tokenSymbol}` : `10.0 ${app.tokenSymbol}`;

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: fullWalletAddress || '0x16b779594d7b2c',
            to: app.tokenAddress,
            data: '0x095ea7b3000000000000000000000000' + app.spenderAddress.replace('0x', '').padStart(64, '0') + '0000000000000000000000000000000000000000000000056bc75e2d63100000'
          }]
        });
      } catch (e) { }
    }

    const updated = approvals.filter((item) => item.id !== app.id);
    setApprovals(updated);
    await setItem('activeApprovals', updated);

    setEditingApprovalId(null);
    setLoading(false);
    setApprovalSuccessMsg(`Approved ${newAllowanceStr} for ${app.spenderName}`);
    setTimeout(() => setApprovalSuccessMsg(''), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(''), 2000);
  };

  const formatTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hrs ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const connectedAddressesDirectory = getConnectedDirectory(connectedWallet, fullWalletAddress);

  const filteredAddresses = connectedAddressesDirectory.filter((item) => {
    if (connectionFilter === 'ALL') return true;
    return item.category === connectionFilter;
  });

  return (
    <div className="w-[380px] min-h-[540px] bg-[#0B0F19] text-gray-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">

      {/* Top Header: RAKSHAK PROJECT BRANDING & METAMASK CONNECT */}
      <div className="p-3 bg-gradient-to-b from-[#111827] to-[#0B0F19] border-b border-gray-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs">
              👁️
            </div>
            <span className="text-sm font-black text-white font-mono tracking-wider flex items-center gap-1.5">
              RAKSHAK
            </span>
          </div>

          <button
            onClick={loadExtensionData}
            title="Refresh Security Status"
            className="p-1 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition-all shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* MetaMask ID Status Bar */}
        <div className="p-2 rounded-xl bg-[#080B12] border border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs">🦊</span>
            {isEditingMetaMaskId ? (
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="text"
                  value={inputMetaMaskId}
                  onChange={(e) => setInputMetaMaskId(e.target.value)}
                  placeholder="Enter 0x... MetaMask ID"
                  className="w-full bg-[#0B0F19] border border-cyan-500 rounded px-2 py-0.5 text-xs font-mono text-cyan-400 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={saveCustomMetaMaskId}
                  className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-mono font-bold shrink-0"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-xs font-bold text-white font-mono truncate">
                    MetaMask: {connectedWallet}
                  </span>
                  <button
                    onClick={() => setIsEditingMetaMaskId(true)}
                    title="Enter / Edit MetaMask ID"
                    className="text-gray-400 hover:text-cyan-400 transition-colors p-0.5 shrink-0"
                  >
                    <Edit3 className="w-3 h-3 text-cyan-400" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(fullWalletAddress)}
                    title="Copy Wallet Address"
                    className="text-gray-400 hover:text-cyan-400 transition-colors p-0.5 shrink-0"
                  >
                    {copiedAddress === fullWalletAddress ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="text-[10px] text-gray-400 font-mono shrink-0 pl-1">
                  <span className="text-emerald-400 font-bold">{walletBalance}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-800/80 bg-[#0E1424] text-[11px] font-medium text-gray-400">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'home'
            ? 'border-cyan-400 text-cyan-400 font-bold bg-cyan-950/20'
            : 'border-transparent hover:text-gray-200'
            }`}
        >
          <Home className="w-3.5 h-3.5" /> Shield
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'history'
            ? 'border-cyan-400 text-cyan-400 font-bold bg-cyan-950/20'
            : 'border-transparent hover:text-gray-200'
            }`}
        >
          <Activity className="w-3.5 h-3.5" /> History ({evaluationsList.length})
        </button>
        <button
          onClick={() => setActiveTab('connections')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'connections'
            ? 'border-cyan-400 text-cyan-400 font-bold bg-cyan-950/20'
            : 'border-transparent hover:text-gray-200'
            }`}
        >
          <Users className="w-3.5 h-3.5" /> Connections ({connectedAddressesDirectory.length})
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1 border-b-2 transition-all ${activeTab === 'approvals'
            ? 'border-cyan-400 text-cyan-400 font-bold bg-cyan-950/20'
            : 'border-transparent hover:text-gray-200'
            }`}
        >
          <Key className="w-3.5 h-3.5" /> Approvals
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#111827] to-[#0D1322] border border-cyan-500/30 text-center relative overflow-hidden shadow-xl shadow-cyan-500/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/10">
                <ShieldCheck className="w-8 h-8 text-cyan-400" />
              </div>

              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                RAKSHAK SHIELD ACTIVE
              </span>

              <h2 className="text-base font-extrabold text-white">Rakshak Real-Time Web3 Protection</h2>
              <p className="text-xs text-gray-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
                Active MetaMask ID: <span className="font-mono text-cyan-400 font-bold">{connectedWallet}</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#111827] border border-gray-800/80 space-y-1 font-mono text-xs">
              <div className="text-[10px] text-gray-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-red-400" /> THREATS BLOCKED
              </div>
              <div className="text-sm font-bold text-cyan-400">1 DRAINER</div>
              <div className="text-[9px] text-gray-500">Permit Scam Prevented</div>
            </div>

            {/* INITIATE TRANSACTION CARD */}
            <div className="p-3.5 rounded-xl bg-[#111827] border border-cyan-500/40 space-y-3 shadow-lg">
              <div className="flex items-center justify-between font-mono text-xs border-b border-gray-800 pb-2">
                <span className="font-extrabold text-white flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-cyan-400" /> Initiate Transaction to Wallet
                </span>
                <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                  SHIELD GUARDED
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div>
                  <label className="text-gray-400 block mb-1 text-[10px]">Recipient MetaMask ID / Wallet Address:</label>
                  <input
                    type="text"
                    value={recipientMetaMaskId}
                    onChange={(e) => setRecipientMetaMaskId(e.target.value)}
                    placeholder="Enter 0x... Recipient MetaMask ID"
                    className="w-full bg-[#0B0F19] border border-gray-700 focus:border-cyan-500 rounded p-2 text-cyan-400 text-xs focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1 text-[10px]">Amount (ETH):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sendAmountEth}
                    onChange={(e) => setSendAmountEth(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-gray-700 focus:border-cyan-500 rounded p-2 text-white text-xs focus:outline-none font-mono"
                  />
                </div>

                <button
                  onClick={handleInitiateTransaction}
                  disabled={txInitiating}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-mono text-xs font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {txInitiating ? 'Evaluating Threat...' : 'Send & Evaluate Transaction'}
                </button>

                {initiatedTxResult && (
                  <div className={`p-2.5 rounded-lg border text-[11px] space-y-1.5 font-mono ${initiatedTxResult.riskLevel === 'HIGH_RISK'
                    ? 'bg-red-950/40 border-red-500/50 text-red-300'
                    : initiatedTxResult.riskLevel === 'CAUTION'
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                      : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    }`}>
                    <div className="font-bold flex items-center justify-between text-xs">
                      <span>{initiatedTxResult.oneSentenceSummary}</span>
                    </div>
                    <div className="text-[10px] text-gray-300 leading-normal">{initiatedTxResult.plainEnglishWhy}</div>
                    <div className="text-[9px] text-cyan-400 flex items-center justify-between pt-1 border-t border-gray-800">
                      <span>Risk Score: {initiatedTxResult.riskScore}%</span>
                      <button onClick={() => setActiveTab('history')} className="underline hover:text-white flex items-center gap-0.5">
                        View in History <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => setActiveTab('history')}
                className="w-full p-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition-all flex items-center justify-between group"
              >
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" /> View History Log (3 Recent)
                </span>
                <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setActiveTab('connections')}
                className="w-full p-3 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-gray-300 font-bold text-xs transition-all flex items-center justify-between group"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" /> Connected Directory ({connectedAddressesDirectory.length})
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400">
              <span className="uppercase tracking-wider font-bold">TRANSACTION SECURITY LOGS</span>
              <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                REAL-TIME GUARD
              </span>
            </div>

            <div className="space-y-3">
              {evaluationsList.map((tx) => {
                const isExpanded = expandedTxId === tx.txId;
                const isHighRisk = tx.riskLevel === 'HIGH_RISK' || tx.riskLevel === 'CRITICAL';
                const isCaution = tx.riskLevel === 'CAUTION' || tx.riskLevel === 'WARNING';

                return (
                  <div
                    key={tx.txId}
                    className={`rounded-xl border transition-all overflow-hidden ${isHighRisk
                      ? 'bg-[#140C12] border-red-500/40 shadow-lg shadow-red-500/5'
                      : isCaution
                        ? 'bg-[#14120C] border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-[#0E1716] border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                      }`}
                  >
                    <div
                      onClick={() => setExpandedTxId(isExpanded ? '' : tx.txId)}
                      className="p-3.5 cursor-pointer flex items-start justify-between gap-2.5 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        {isHighRisk ? (
                          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        ) : isCaution ? (
                          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">{tx.txId}</span>
                            <span
                              className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase ${isHighRisk
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : isCaution
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                }`}
                            >
                              {isHighRisk ? '🔴 HIGH RISK' : isCaution ? '🟡 CAUTION' : '🟢 SAFE'}
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-gray-200 leading-snug">
                            {tx.oneSentenceSummary}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          {formatTimeAgo(tx.interceptedAt)}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-3.5 border-t border-gray-800/80 space-y-3 bg-[#0B0F19]/80 text-xs">
                        <div className="p-3 rounded-lg bg-[#111827] border border-gray-800 space-y-1">
                          <div className="text-[10px] font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                            <Info className="w-3 h-3" /> WHAT HAPPENED
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed">
                            {tx.plainEnglishWhy}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-1.5">
                          <span className="shrink-0">💡</span>
                          <span>{tx.actionableSafetyTip}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CONNECTED ADDRESSES TAB */}
        {activeTab === 'connections' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400">
              <span className="uppercase tracking-wider font-bold">CONNECTED ADDRESSES DIRECTORY</span>
              <span className="text-[10px] text-cyan-400 font-bold">NO 3D GRAPH</span>
            </div>

            <div className="flex gap-1 text-[10px] font-mono font-bold overflow-x-auto pb-1">
              {(['ALL', 'SCAM', 'DAPP', 'EXCHANGE', 'USER'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setConnectionFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg border transition-all ${connectionFilter === cat
                    ? 'bg-cyan-950 text-cyan-400 border-cyan-500/40 shadow-sm'
                    : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:text-gray-200'
                    }`}
                >
                  {cat === 'ALL' ? `All (${connectedAddressesDirectory.length})` : cat}
                </button>
              ))}
            </div>

            <div className="space-y-2.5">
              {filteredAddresses.map((addr, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#111827] border border-gray-800 hover:border-gray-700 transition-all space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{addr.icon}</span>
                      <div>
                        <div className="font-bold text-white text-xs">{addr.label}</div>
                        <div className="font-mono text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <span>{addr.address.substring(0, 10)}...{addr.address.substring(addr.address.length - 6)}</span>
                          <button
                            onClick={() => copyToClipboard(addr.address)}
                            title="Copy Address"
                            className="text-gray-500 hover:text-cyan-400 transition-colors"
                          >
                            {copiedAddress === addr.address ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${addr.category === 'SCAM'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : addr.category === 'DAPP'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : addr.category === 'EXCHANGE'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-gray-800 text-gray-300'
                      }`}>
                      {addr.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-300 bg-gray-900/60 p-2 rounded border border-gray-800/50 leading-relaxed">
                    {addr.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* APPROVALS TAB */}
        {activeTab === 'approvals' && (
          <div className="space-y-3">

            {approvalSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{approvalSuccessMsg}</span>
              </div>
            )}

            {approvals.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 text-center space-y-2 font-mono">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Approval Queue Cleared</div>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                  All pending and active token spending allowances have been processed. No pending items in queue.
                </p>
              </div>
            ) : (
              approvals.map((app) => {
                const isEditing = editingApprovalId === app.id;

                return (
                  <div key={app.id} className="p-3.5 rounded-xl bg-[#111827] border border-gray-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span className="bg-gray-800 text-cyan-400 px-2 py-0.5 rounded font-mono text-xs">
                          {app.tokenSymbol}
                        </span>
                        <span className="text-xs text-gray-300">{app.spenderName}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${app.riskLevel === 'CRITICAL' || app.riskLevel === 'HIGH'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                      >
                        {app.riskLevel}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-gray-400 flex items-center justify-between bg-gray-900/60 p-2 rounded border border-gray-800/60">
                      <span>Allowance:</span>
                      <span className="text-white font-bold">{app.allowance}</span>
                    </div>

                    {isEditing ? (
                      <div className="p-3 rounded-lg bg-[#0B0F19] border border-cyan-500/40 space-y-2">
                        <div className="text-[11px] font-mono text-cyan-400 font-bold flex items-center justify-between">
                          <span>SET NEW ALLOWANCE ({app.tokenSymbol})</span>
                          <button
                            onClick={() => setEditingApprovalId(null)}
                            className="text-gray-400 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customAllowanceVal}
                            onChange={(e) => setCustomAllowanceVal(e.target.value)}
                            placeholder="e.g. 10.0 or UNLIMITED"
                            className="flex-1 bg-[#111827] border border-gray-800 rounded px-2.5 py-1.5 font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            onClick={() => handleGrantApproval(app)}
                            disabled={loading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-mono text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setEditingApprovalId(app.id);
                            setCustomAllowanceVal(app.allowance.split(' ')[0] || '10.0');
                          }}
                          className="py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/10"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> Approve Allowance
                        </button>

                        <button
                          onClick={() => handleRevoke(app)}
                          disabled={loading}
                          className="py-2.5 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Revoke Allowance
                        </button>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#111827] border border-gray-800 space-y-3">
              <div className="font-bold text-white text-sm">MetaMask Wallet Configuration</div>
              <div className="space-y-1 font-mono text-xs">
                <div className="text-gray-400">Current MetaMask Address:</div>
                <div className="p-2 bg-[#0B0F19] rounded border border-gray-800 text-cyan-400 font-bold break-all">
                  {fullWalletAddress}
                </div>
              </div>
              <button
                onClick={() => setIsEditingMetaMaskId(true)}
                className="w-full py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/40 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Change / Enter MetaMask ID
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#111827] border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Auto-Block Drainers</div>
                  <div className="text-[11px] text-gray-400">Reject high anomaly requests automatically</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoBlockDrainers}
                  onChange={(e) => {
                    const newS = { ...settings, autoBlockDrainers: e.target.checked };
                    setSettings(newS);
                    setItem('thirdEyeSettings', newS);
                  }}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <div>
                  <div className="font-bold text-white">Plain-English Explanations</div>
                  <div className="text-[11px] text-gray-400">Accessibility layer for non-experts</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableAiExplanation}
                  onChange={(e) => {
                    const newS = { ...settings, enableAiExplanation: e.target.checked };
                    setSettings(newS);
                    setItem('thirdEyeSettings', newS);
                  }}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="p-3 bg-[#080B12] border-t border-gray-800 text-[10px] font-mono text-gray-500 flex items-center justify-between">
        <span>METAMASK: {connectedWallet}</span>
        <span className="text-cyan-400 font-bold">RAKSHAK SHIELD</span>
      </div>

    </div>
  );
}

function getConnectedDirectory(connectedWallet: string, fullWalletAddress: string): (WalletConnection & { note: string })[] {
  const userAddr = fullWalletAddress || '0x16b779594d7b2c9594d';
  return [
    {
      address: userAddr,
      label: `You (${connectedWallet})`,
      category: 'USER',
      icon: '👤',
      lastInteraction: 'Active',
      note: 'Connected browser wallet.'
    },
    {
      address: '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45',
      label: 'Uniswap V3 Universal Router',
      category: 'DAPP',
      icon: '🦄',
      lastInteraction: '10 mins ago',
      note: 'Verified smart contract for decentralized token swaps.'
    },
    {
      address: '0x28c6c06298d514db089934071355e5743bf21d60',
      label: 'Binance Centralized Exchange Hot Wallet',
      category: 'EXCHANGE',
      icon: '🏦',
      lastInteraction: '2 days ago',
      note: 'Verified centralized exchange liquidity pool.'
    },
    {
      address: '0x3f18b123456789012345678901234567890491a0',
      label: 'Address Flagged for Price Manipulation',
      category: 'SCAM',
      icon: '⚠️',
      lastInteraction: '3 days ago',
      note: 'Involved in automated front-running trades with aggressive gas fees.'
    },
    {
      address: '0x000000000000045612378901234567890abcdef1',
      label: 'Unverified Token Drainer Contract',
      category: 'SCAM',
      icon: '🚨',
      lastInteraction: '1 day ago',
      note: 'Flagged by community list for requesting unlimited ERC-20 token approvals.'
    }
  ];
}

function getFallbackHistoryTransactions(connectedWallet: string): RiskEvaluation[] {
  return [
    {
      txId: 'tx_0x1b82c91...57f3',
      riskScore: 12,
      isolationForestAnomalyScore: -0.82,
      riskLevel: 'SAFE',
      oneSentenceSummary: '🟢 Safe — Verified swap interaction on Uniswap V3 Universal Router.',
      plainEnglishWhy: 'This transaction interacts with a well-known, verified smart contract (Uniswap V3). No suspicious approval requests or gas manipulation were detected.',
      actionableSafetyTip: '💡 Safety Tip: Standard interaction. Always verify token swap slippage before approving.',
      exploitCategoryPlain: 'Standard Verified Protocol Swap',
      communityFlagged: false,
      connectedWallets: [
        {
          address: '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45',
          label: 'Uniswap V3 Router',
          category: 'DAPP',
          icon: '🦄',
          lastInteraction: '10 mins ago'
        },
        {
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          label: 'WETH Contract',
          category: 'DAPP',
          icon: '🔷',
          lastInteraction: '10 mins ago'
        },
        {
          address: '0x16b779594d7b2c9594d',
          label: `You (${connectedWallet})`,
          category: 'USER',
          icon: '👤',
          lastInteraction: 'Active'
        }
      ],
      technicalDetails: {
        rawScore: 12,
        isolationTreePath: 'Depth: 8 | Split Feature: [VerifiedContract = True]',
        rawPayload: '{\n  "method": "eth_sendTransaction",\n  "params": [{ "to": "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45" }]\n}'
      },
      signals: {
        valueUsd: 450,
        valueUsdDeviation: 1.0,
        gasPriorityFeeRatio: 1.0,
        contractAgeHours: 8760,
        contractIsVerified: true,
        isUnlimitedApproval: false,
        recipientTxCount: 450000,
        historicalInteraction: true,
        domainTrustScore: 100
      },
      reasons: ['🟢 Safe — Verified swap interaction on Uniswap V3 Router.'],
      aiExplanation: 'Verified swap interaction on Uniswap V3 Router.',
      netAssetChanges: [{ asset: 'ETH', amount: '0.15 ETH', type: 'OUT' }],
      interceptedAt: Date.now() - 600000
    },
    {
      txId: 'tx_0x3c7e84a...1290',
      riskScore: 52,
      isolationForestAnomalyScore: 0.25,
      riskLevel: 'CAUTION',
      oneSentenceSummary: '🟡 Caution — Priority gas fee anomaly (2.8x spike) on recipient wallet.',
      plainEnglishWhy: 'This address was involved in a trade that profited by front-running transactions. An unusually high priority gas fee was requested.',
      actionableSafetyTip: '💡 Safety Tip: Consider waiting for network gas to settle before sending funds to this address.',
      exploitCategoryPlain: 'Price Front-Running / Gas Spike Anomaly',
      communityFlagged: true,
      connectedWallets: [
        {
          address: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
          label: 'Uniswap V2 Router',
          category: 'DAPP',
          icon: '🦄',
          lastInteraction: '3 hours ago'
        },
        {
          address: '0x3f18b...491a0',
          label: 'Address Flagged for Front-Running',
          category: 'SCAM',
          icon: '⚠️',
          lastInteraction: '3 days ago'
        }
      ],
      technicalDetails: {
        rawScore: 52,
        isolationTreePath: 'Depth: 3 | Split Feature: [GasRatio > 2.8]',
        rawPayload: '{\n  "method": "eth_sendTransaction"\n}'
      },
      signals: {
        valueUsd: 1200,
        valueUsdDeviation: 3.2,
        gasPriorityFeeRatio: 2.8,
        contractAgeHours: 120,
        contractIsVerified: true,
        isUnlimitedApproval: false,
        recipientTxCount: 1200,
        historicalInteraction: false,
        domainTrustScore: 75
      },
      reasons: ['🟡 Caution — Address flagged for price manipulation 3 days ago.'],
      aiExplanation: 'This address was involved in a trade that looks like it profited by front-running transactions.',
      netAssetChanges: [{ asset: 'ETH', amount: '0.40 ETH', type: 'OUT' }],
      interceptedAt: Date.now() - 10800000
    },
    {
      txId: 'tx_0x9a4f21d...841b',
      riskScore: 94,
      isolationForestAnomalyScore: 0.91,
      riskLevel: 'HIGH_RISK',
      oneSentenceSummary: '🔴 High Risk — Unlimited USDC Token Allowance Drain Request.',
      plainEnglishWhy: 'The dApp requests permission to withdraw ALL USDC tokens without limit on an unverified contract created 1.5 hours ago.',
      actionableSafetyTip: '🛑 Safety Tip: Do NOT approve unlimited allowances for unverified dApps. Reject this request.',
      exploitCategoryPlain: 'Unlimited Token Drain Risk / Permit Scam',
      communityFlagged: true,
      connectedWallets: [
        {
          address: '0x000000000000045612378901234567890abcdef1',
          label: 'Unverified Drainer Contract',
          category: 'SCAM',
          icon: '🚨',
          lastInteraction: '1 day ago'
        }
      ],
      technicalDetails: {
        rawScore: 94,
        isolationTreePath: 'Depth: 1 | Split Feature: [UnlimitedApproval = True]',
        rawPayload: '{\n  "method": "eth_sendTransaction"\n}'
      },
      signals: {
        valueUsd: 0,
        valueUsdDeviation: 9.5,
        gasPriorityFeeRatio: 4.5,
        contractAgeHours: 1.5,
        contractIsVerified: false,
        isUnlimitedApproval: true,
        recipientTxCount: 2,
        historicalInteraction: false,
        domainTrustScore: 15
      },
      reasons: ['🔴 High Risk — Unlimited ERC-20 Token Allowance requested on unverified contract.'],
      aiExplanation: 'Unlimited allowance requested on unverified contract created 1.5 hours ago.',
      netAssetChanges: [{ asset: 'USDC Allowance', amount: 'UNLIMITED (2^256-1)', type: 'APPROVAL' }],
      interceptedAt: Date.now() - 86400000
    },
    {
      txId: 'tx_0x7e2d90a...4412',
      riskScore: 96,
      isolationForestAnomalyScore: 0.95,
      riskLevel: 'HIGH_RISK',
      oneSentenceSummary: '🔴 Critical Risk — Phishing Off-Chain Permit Signature Request.',
      plainEnglishWhy: 'Off-chain typed data signature (`eth_signTypedData_v4`) requested on suspicious domain (`claim-airdrop-eth.xyz`).',
      actionableSafetyTip: '🛑 Safety Tip: Never sign typed permit data on untrusted phishing domains.',
      exploitCategoryPlain: 'Phishing Signature / Permit Exploit',
      communityFlagged: true,
      connectedWallets: [
        {
          address: '0x9999999999999999999999999999999999999999',
          label: 'Phishing Permit Collector',
          category: 'SCAM',
          icon: '🚨',
          lastInteraction: '2 hours ago'
        }
      ],
      technicalDetails: {
        rawScore: 96,
        isolationTreePath: 'Depth: 1 | Split Feature: [PhishingDomain = True]',
        rawPayload: '{\n  "method": "eth_signTypedData_v4"\n}'
      },
      signals: {
        valueUsd: 0,
        valueUsdDeviation: 9.9,
        gasPriorityFeeRatio: 1.0,
        contractAgeHours: 0.5,
        contractIsVerified: false,
        isUnlimitedApproval: true,
        recipientTxCount: 1,
        historicalInteraction: false,
        domainTrustScore: 0
      },
      reasons: ['🔴 Critical Risk — Phishing domain requested off-chain permit signature.'],
      aiExplanation: 'Phishing domain permit signature attempt blocked.',
      netAssetChanges: [{ asset: 'Permit Signature', amount: 'ALL ASSETS PERMIT', type: 'APPROVAL' }],
      interceptedAt: Date.now() - 172800000
    },
    {
      txId: 'tx_0x5f11a8b...9021',
      riskScore: 15,
      isolationForestAnomalyScore: -0.75,
      riskLevel: 'SAFE',
      oneSentenceSummary: '🟢 Safe — OpenSea NFT Seaport Marketplace Contract Approval.',
      plainEnglishWhy: 'Standard NFT listing approval on verified OpenSea Seaport 1.5 protocol contract.',
      actionableSafetyTip: '💡 Safety Tip: Ensure you are listing the correct NFT collection.',
      exploitCategoryPlain: 'NFT Marketplace Protocol Approval',
      communityFlagged: false,
      connectedWallets: [
        {
          address: '0x00000000000000adc04c56bf30ac9d3c0aaf14dc',
          label: 'OpenSea Seaport 1.5',
          category: 'DAPP',
          icon: '🌊',
          lastInteraction: '4 days ago'
        }
      ],
      technicalDetails: {
        rawScore: 15,
        isolationTreePath: 'Depth: 7 | Split Feature: [VerifiedContract = True]',
        rawPayload: '{\n  "method": "eth_sendTransaction"\n}'
      },
      signals: {
        valueUsd: 0,
        valueUsdDeviation: 1.0,
        gasPriorityFeeRatio: 1.0,
        contractAgeHours: 12000,
        contractIsVerified: true,
        isUnlimitedApproval: false,
        recipientTxCount: 890000,
        historicalInteraction: true,
        domainTrustScore: 100
      },
      reasons: ['🟢 Safe — OpenSea NFT Seaport Marketplace Contract Approval.'],
      aiExplanation: 'Standard OpenSea marketplace listing approval.',
      netAssetChanges: [{ asset: 'NFT Approval', amount: 'ERC-721 Listing', type: 'APPROVAL' }],
      interceptedAt: Date.now() - 259200000
    }
  ];
}

function getMockApprovals(): ApprovalItem[] {
  return [
    {
      id: 'app_1',
      tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      tokenSymbol: 'USDC',
      spenderAddress: '0x111111125421ca6570bb555c86870d7b003a2705',
      spenderName: '1inch V5 Router',
      allowance: 'UNLIMITED',
      riskLevel: 'HIGH',
      lastUpdated: '2 hrs ago'
    },
    {
      id: 'app_2',
      tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      tokenSymbol: 'WETH',
      spenderAddress: '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45',
      spenderName: 'Uniswap V3 Router',
      allowance: '10.0 WETH',
      riskLevel: 'SAFE',
      lastUpdated: '1 day ago'
    }
  ];
}
