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
  Edit3,
  Send,
  ArrowUpRight,
  ExternalLink,
  Sliders,
  XCircle,
  Radio
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
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
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

    const evaluation = anomalyEngine.evaluateRequest(req);
    const isUnverifiedTarget = evaluation.riskLevel === 'HIGH_RISK';

    const displayAddr = recipient.length > 12 ? `${recipient.substring(0, 6)}...${recipient.substring(recipient.length - 4)}` : recipient;
    evaluation.connectedWallets = [
      { address: recipient, label: `Recipient (${displayAddr})`, category: isUnverifiedTarget ? 'SCAM' : 'USER', icon: isUnverifiedTarget ? 'alert' : 'user', lastInteraction: 'Just now' },
      { address: fullWalletAddress, label: `You (${connectedWallet})`, category: 'USER', icon: 'user', lastInteraction: 'Active' }
    ];

    const stored = (await getItem<RiskEvaluation[]>('recentEvaluations')) || [];
    const updatedList = [evaluation, ...stored].slice(0, 10);
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
    checkBackendHealth();

    const cleanup = setupDynamicListeners();
    return () => {
      cleanup && cleanup();
    };
  }, []);

  const checkBackendHealth = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/health');
      setBackendOnline(res.ok);
    } catch (e) {
      setBackendOnline(false);
    }
  };

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
    setLoading(true);
    const historyData = getFallbackHistoryTransactions(connectedWallet);
    const savedSettings = await getItem<ExtensionSettings>('thirdEyeSettings');
    if (savedSettings) setSettings(savedSettings);

    const storedEvals = await getItem<RiskEvaluation[]>('recentEvaluations');
    if (storedEvals && storedEvals.length > 0) {
      setEvaluationsList(storedEvals);
      if (storedEvals[0]?.txId) setExpandedTxId(storedEvals[0].txId);
    } else {
      setEvaluationsList(historyData);
      if (historyData[0]?.txId) setExpandedTxId(historyData[0].txId);
      await setItem('recentEvaluations', historyData);
    }

    const storedApprovals = await getItem<ApprovalItem[]>('activeApprovals');
    if (storedApprovals && storedApprovals.length > 0) {
      setApprovals(storedApprovals);
    } else {
      const mocks = getMockApprovals();
      setApprovals(mocks);
      setItem('activeApprovals', mocks);
    }
    await checkBackendHealth();
    setLoading(false);
  };

  const handleRevoke = async (appToRevoke: ApprovalItem) => {
    setLoading(true);
    const updated = approvals.filter((a) => a.id !== appToRevoke.id);
    setApprovals(updated);
    await setItem('activeApprovals', updated);
    setApprovalSuccessMsg(`Revoked allowance for ${appToRevoke.spenderName}`);
    setTimeout(() => setApprovalSuccessMsg(''), 3000);
    setLoading(false);
  };

  const handleGrantApproval = async (app: ApprovalItem) => {
    setLoading(true);
    const newAllowanceStr = customAllowanceVal ? `${customAllowanceVal} ${app.tokenSymbol}` : `10.0 ${app.tokenSymbol}`;

    const updated = approvals.map((item) =>
      item.id === app.id ? { ...item, allowance: newAllowanceStr, riskLevel: 'SAFE' as const } : item
    );
    setApprovals(updated);
    await setItem('activeApprovals', updated);

    setEditingApprovalId(null);
    setLoading(false);
    setApprovalSuccessMsg(`Updated allowance: ${newAllowanceStr}`);
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
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const connectedAddressesDirectory = getConnectedDirectory(connectedWallet, fullWalletAddress);

  const filteredAddresses = connectedAddressesDirectory.filter((item) => {
    if (connectionFilter === 'ALL') return true;
    return item.category === connectionFilter;
  });

  return (
    <div className="w-[380px] min-h-[560px] max-h-[600px] bg-[#070A12] text-slate-200 flex flex-col font-sans select-none overflow-hidden border border-slate-800 shadow-2xl">

      {/* Extension Header: Brand & Identity */}
      <div className="p-3 bg-gradient-to-b from-slate-900 via-slate-950 to-[#070A12] border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-white font-mono tracking-wider">RAKSHAK</span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">SENTINEL</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>ARMED</span>
            </span>

            <button
              onClick={loadExtensionData}
              title="Sync Status"
              className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Wallet Address & Network Pill */}
        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-0 font-mono">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold border border-slate-700 shrink-0">
              {networkName}
            </span>

            {isEditingMetaMaskId ? (
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="text"
                  value={inputMetaMaskId}
                  onChange={(e) => setInputMetaMaskId(e.target.value)}
                  placeholder="0x... address"
                  className="w-full bg-slate-950 border border-cyan-500 rounded px-2 py-0.5 text-xs text-cyan-300 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={saveCustomMetaMaskId}
                  className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold shrink-0"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold text-slate-200 text-xs truncate">
                    {connectedWallet}
                  </span>
                  <button
                    onClick={() => setIsEditingMetaMaskId(true)}
                    title="Edit Wallet ID"
                    className="text-slate-500 hover:text-cyan-400 p-0.5 transition-colors shrink-0"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(fullWalletAddress)}
                    title="Copy Address"
                    className="text-slate-500 hover:text-cyan-400 p-0.5 transition-colors shrink-0"
                  >
                    {copiedAddress === fullWalletAddress ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold shrink-0 pl-1">
                  {walletBalance}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Extension Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950 text-[11px] font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 py-2 flex items-center justify-center gap-1 border-b-2 transition-all ${
            activeTab === 'home'
              ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-950/20'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          <Home className="w-3.5 h-3.5" /> Shield
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 flex items-center justify-center gap-1 border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-950/20'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> History ({evaluationsList.length})
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex-1 py-2 flex items-center justify-center gap-1 border-b-2 transition-all ${
            activeTab === 'approvals'
              ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-950/20'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          <Key className="w-3.5 h-3.5" /> Approvals
        </button>

        <button
          onClick={() => setActiveTab('connections')}
          className={`flex-1 py-2 flex items-center justify-center gap-1 border-b-2 transition-all ${
            activeTab === 'connections'
              ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-950/20'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> Directory
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-2 flex items-center justify-center border-b-2 transition-all ${
            activeTab === 'settings'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-200'
          }`}
          title="Extension Settings"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5">

        {/* TAB 1: SHIELD (HOME) */}
        {activeTab === 'home' && (
          <div className="space-y-3">
            
            {/* Status Shield Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-center relative overflow-hidden shadow-lg">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2 shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div className="text-xs font-bold text-white tracking-wide">
                Real-Time Web3 Pre-Signing Firewall
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {activeDomain ? `Guarding ${activeDomain}` : 'Scanning EVM Provider'}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-400 block uppercase">Threats Blocked</span>
                  <span className="text-rose-400 font-bold text-sm">1 Drainer</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-400 block uppercase">Isolation Forest</span>
                  <span className={`font-bold text-sm ${backendOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {backendOnline ? 'Online (8000)' : 'Client Heuristic'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Security Toggles */}
            <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2 text-xs">
              <div className="text-[10px] uppercase font-mono font-bold text-slate-400 pb-1 border-b border-slate-800">
                ACTIVE PROTECTION PROTOCOLS
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Auto-Quarantine Drainers</div>
                  <div className="text-[10px] text-slate-400">Intercepts infinite token permits (2^256-1)</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoBlockDrainers}
                  onChange={(e) => {
                    const newS = { ...settings, autoBlockDrainers: e.target.checked };
                    setSettings(newS);
                    setItem('thirdEyeSettings', newS);
                  }}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60">
                <div>
                  <div className="font-semibold text-slate-200">AI Threat Explainability</div>
                  <div className="text-[10px] text-slate-400">Natural language risk analysis</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableAiExplanation}
                  onChange={(e) => {
                    const newS = { ...settings, enableAiExplanation: e.target.checked };
                    setSettings(newS);
                    setItem('thirdEyeSettings', newS);
                  }}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* In-Extension Transaction Simulation Widget */}
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-cyan-400" /> Test Transaction Sandbox
                </span>
                <span className="text-[9px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                  PRE-SIGN TEST
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1 text-[10px]">Recipient Contract Address:</label>
                  <input
                    type="text"
                    value={recipientMetaMaskId}
                    onChange={(e) => setRecipientMetaMaskId(e.target.value)}
                    placeholder="0x... Target Address"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-2.5 py-1.5 text-cyan-300 text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1 text-[10px]">Value (ETH):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sendAmountEth}
                      onChange={(e) => setSendAmountEth(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleInitiateTransaction}
                      disabled={txInitiating}
                      className="w-full py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      {txInitiating ? 'Analyzing...' : 'Simulate'}
                    </button>
                  </div>
                </div>

                {initiatedTxResult && (
                  <div className={`p-2.5 rounded-xl border text-[11px] space-y-1 font-mono ${
                    initiatedTxResult.riskLevel === 'HIGH_RISK'
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                      : initiatedTxResult.riskLevel === 'CAUTION'
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                      : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  }`}>
                    <div className="font-bold flex items-center justify-between text-xs">
                      <span>{initiatedTxResult.oneSentenceSummary}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950">
                        {initiatedTxResult.riskScore}%
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-300">{initiatedTxResult.plainEnglishWhy}</div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="uppercase font-bold">Transaction Security Audits</span>
              <span className="text-[10px] text-cyan-400">{evaluationsList.length} Records</span>
            </div>

            <div className="space-y-2">
              {evaluationsList.map((tx) => {
                const isExpanded = expandedTxId === tx.txId;
                const isHighRisk = tx.riskLevel === 'HIGH_RISK' || tx.riskLevel === 'CRITICAL';
                const isCaution = tx.riskLevel === 'CAUTION' || tx.riskLevel === 'WARNING';

                return (
                  <div
                    key={tx.txId}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isHighRisk
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : isCaution
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div
                      onClick={() => setExpandedTxId(isExpanded ? '' : tx.txId)}
                      className="p-3 cursor-pointer flex items-start justify-between gap-2 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {isHighRisk ? (
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        ) : isCaution ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-mono text-[10px]">
                            <span className="font-bold text-white truncate">{tx.txId}</span>
                            <span className="text-slate-500">• {formatTimeAgo(tx.interceptedAt || Date.now())}</span>
                          </div>
                          <div className="text-xs text-slate-300 font-semibold truncate mt-0.5">
                            {tx.oneSentenceSummary}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isHighRisk ? 'bg-rose-950 text-rose-400 border border-rose-800' : isCaution ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}>
                          {tx.riskScore}%
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2 font-mono text-[11px]">
                        <p className="text-slate-300 font-sans leading-relaxed text-xs">
                          {tx.plainEnglishWhy}
                        </p>

                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-400 space-y-1">
                          <div>Anomaly Factor: <span className="text-cyan-300 font-bold">{tx.isolationForestAnomalyScore}</span></div>
                          <div>Gas Ratio: <span className="text-slate-200">{tx.signals.gasPriorityFeeRatio}x</span> | Verified: <span className="text-slate-200">{tx.signals.contractIsVerified ? 'Yes' : 'No'}</span></div>
                          <div>Unlimited Allowance: <span className={tx.signals.isUnlimitedApproval ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{tx.signals.isUnlimitedApproval ? 'TRUE' : 'False'}</span></div>
                        </div>

                        {tx.actionableSafetyTip && (
                          <div className="text-xs text-slate-300 flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                            <span>{tx.actionableSafetyTip}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: APPROVALS */}
        {activeTab === 'approvals' && (
          <div className="space-y-3">
            {approvalSuccessMsg && (
              <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{approvalSuccessMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="uppercase font-bold">Active Token Allowances</span>
              <span className="text-[10px] text-slate-500">Revoke drainer access</span>
            </div>

            {approvals.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2 font-mono">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <div className="text-xs font-bold text-white">All Allowances Revoked</div>
                <p className="text-[11px] text-slate-400 font-sans">
                  No active token approvals found. Your wallet is safe from approval drainers.
                </p>
              </div>
            ) : (
              approvals.map((app) => {
                const isEditing = editingApprovalId === app.id;
                const isHigh = app.riskLevel === 'HIGH' || app.riskLevel === 'CRITICAL';

                return (
                  <div key={app.id} className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-xs font-bold border border-slate-700">
                          {app.tokenSymbol}
                        </span>
                        <span className="text-xs font-bold text-white">{app.spenderName}</span>
                      </div>

                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isHigh ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {app.riskLevel}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono flex items-center justify-between text-slate-400">
                      <span>Allowance:</span>
                      <span className={isHigh ? 'text-rose-400 font-bold' : 'text-slate-200 font-bold'}>{app.allowance}</span>
                    </div>

                    {isEditing ? (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customAllowanceVal}
                            onChange={(e) => setCustomAllowanceVal(e.target.value)}
                            placeholder="e.g. 10.0"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                          />
                          <button
                            onClick={() => handleGrantApproval(app)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold"
                          >
                            Save
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
                          className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> Adjust Limit
                        </button>

                        <button
                          onClick={() => handleRevoke(app)}
                          className="py-2 px-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Revoke
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 4: CONNECTIONS */}
        {activeTab === 'connections' && (
          <div className="space-y-2.5">
            <div className="flex gap-1 text-[10px] font-mono font-bold overflow-x-auto pb-1">
              {(['ALL', 'SCAM', 'DAPP', 'EXCHANGE', 'USER'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setConnectionFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg border transition-all ${
                    connectionFilter === cat
                      ? 'bg-cyan-950 text-cyan-400 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? `All (${connectedAddressesDirectory.length})` : cat}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredAddresses.map((addr, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{addr.label}</div>
                      <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>{addr.address.substring(0, 8)}...{addr.address.substring(addr.address.length - 4)}</span>
                        <button onClick={() => copyToClipboard(addr.address)} className="text-slate-500 hover:text-cyan-400">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                      addr.category === 'SCAM'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : addr.category === 'DAPP'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {addr.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug">
                    {addr.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-3 text-xs font-sans">
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="font-bold text-white text-xs font-mono uppercase">ML Microservice Endpoint</div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-cyan-300 text-xs">
                {settings.customBackendUrl}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span>Model: scikit-learn IsolationForest</span>
                <span className={backendOnline ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {backendOnline ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="font-bold text-white text-xs font-mono uppercase">Whitelisted dApp Domains</div>
              <div className="space-y-1 font-mono text-[11px] text-slate-300">
                {settings.whitelistedDomains.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span>{d}</span>
                    <span className="text-emerald-400 text-[9px] font-bold">VERIFIED</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Chrome Extension Sticky Footer */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span>EVM PROVIDER PROTECTED</span>
        </span>
        <span className="text-cyan-400 font-bold">v1.2.4</span>
      </div>

    </div>
  );
}

function getConnectedDirectory(connectedWallet: string, fullWalletAddress: string): (WalletConnection & { note: string })[] {
  const userAddr = fullWalletAddress || '0x16b779594d7b2c9594d';
  return [
    {
      address: userAddr,
      label: `Active Account (${connectedWallet})`,
      category: 'USER',
      icon: 'user',
      lastInteraction: 'Active',
      note: 'Primary browser wallet connected to EVM provider.'
    },
    {
      address: '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45',
      label: 'Uniswap V3 Universal Router',
      category: 'DAPP',
      icon: 'dapp',
      lastInteraction: '10 mins ago',
      note: 'Verified smart contract for decentralized token swaps.'
    },
    {
      address: '0x28c6c06298d514db089934071355e5743bf21d60',
      label: 'Binance Hot Wallet Reserve',
      category: 'EXCHANGE',
      icon: 'exchange',
      lastInteraction: '2 days ago',
      note: 'Verified exchange hot wallet liquidity pool.'
    },
    {
      address: '0x3f18b123456789012345678901234567890491a0',
      label: 'Flagged Front-Running MEV Bot',
      category: 'SCAM',
      icon: 'alert',
      lastInteraction: '3 days ago',
      note: 'Involved in automated sandwich trades with aggressive priority gas.'
    },
    {
      address: '0x000000000000045612378901234567890abcdef1',
      label: 'Unverified Token Drainer Contract',
      category: 'SCAM',
      icon: 'alert',
      lastInteraction: '1 day ago',
      note: 'Flagged for requesting unlimited ERC-20 token allowance approvals.'
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
      oneSentenceSummary: 'Safe — Verified Uniswap V3 swap interaction.',
      plainEnglishWhy: 'This transaction interacts with a well-known, verified smart contract (Uniswap V3). No suspicious approval requests or gas manipulation detected.',
      actionableSafetyTip: 'Standard interaction. Safe to proceed.',
      exploitCategoryPlain: 'Standard Verified Protocol Swap',
      communityFlagged: false,
      connectedWallets: [
        {
          address: '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45',
          label: 'Uniswap V3 Router',
          category: 'DAPP',
          icon: 'dapp',
          lastInteraction: '10 mins ago'
        }
      ],
      technicalDetails: {
        rawScore: 12,
        isolationTreePath: 'Depth: 8 | Split Feature: [VerifiedContract = True]',
        rawPayload: '{\n  "method": "eth_sendTransaction"\n}'
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
      reasons: ['Verified swap interaction on Uniswap V3 Router.'],
      aiExplanation: 'Verified swap interaction on Uniswap V3 Router.',
      netAssetChanges: [{ asset: 'ETH', amount: '0.15 ETH', type: 'OUT' }],
      interceptedAt: Date.now() - 600000
    },
    {
      txId: 'tx_0x3c7e84a...1290',
      riskScore: 52,
      isolationForestAnomalyScore: 0.25,
      riskLevel: 'CAUTION',
      oneSentenceSummary: 'Caution — Priority gas fee anomaly (2.8x spike).',
      plainEnglishWhy: 'This address was involved in aggressive priority gas front-running. Proceed with caution.',
      actionableSafetyTip: 'Consider waiting for network gas volatility to settle.',
      exploitCategoryPlain: 'Price Front-Running / Gas Spike Anomaly',
      communityFlagged: true,
      connectedWallets: [],
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
      reasons: ['Abnormal priority gas fee spike (2.8x network baseline).'],
      aiExplanation: 'Address involved in high-priority fee transactions.',
      netAssetChanges: [{ asset: 'ETH', amount: '0.40 ETH', type: 'OUT' }],
      interceptedAt: Date.now() - 10800000
    },
    {
      txId: 'tx_0x9a4f21d...841b',
      riskScore: 94,
      isolationForestAnomalyScore: 0.91,
      riskLevel: 'HIGH_RISK',
      oneSentenceSummary: 'Critical Threat — Unlimited USDC Token Allowance Drainer.',
      plainEnglishWhy: 'Requests permission to withdraw ALL USDC tokens without limit on an unverified contract created 1.5 hours ago.',
      actionableSafetyTip: 'Do NOT approve unlimited allowances for unverified dApps.',
      exploitCategoryPlain: 'Unlimited Token Drain Risk / Permit Scam',
      communityFlagged: true,
      connectedWallets: [],
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
      reasons: ['Unlimited ERC-20 Token Allowance requested on unverified contract.'],
      aiExplanation: 'Unlimited allowance requested on unverified contract.',
      netAssetChanges: [{ asset: 'USDC Allowance', amount: 'UNLIMITED (2^256-1)', type: 'APPROVAL' }],
      interceptedAt: Date.now() - 86400000
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
