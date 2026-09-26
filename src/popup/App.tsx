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
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'approvals' | 'settings'>('home');
  const [fullWalletAddress, setFullWalletAddress] = useState<string>('0x16b779594d7b2c9594d');
  const [connectedWallet, setConnectedWallet] = useState<string>('0x16B77...9594D');
  const [isEditingMetaMaskId, setIsEditingMetaMaskId] = useState<boolean>(false);
  const [inputMetaMaskId, setInputMetaMaskId] = useState<string>('0x16b779594d7b2c9594d');
  const [walletBalance, setWalletBalance] = useState<string>('1.42 ETH');
  const [networkName, setNetworkName] = useState<string>('Base Sepolia');
  const [activeDomain, setActiveDomain] = useState<string>('app.uniswap.org');
  const [expandedTxId, setExpandedTxId] = useState<string>('tx_0x1b82c91...57f3');
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
  type ThemeType = 'tactical' | 'stone';
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('rakshak_theme');
    return saved === 'stone' ? 'stone' : 'tactical';
  });

  const isLightMode = theme === 'stone';
  const brandColor = isLightMode ? '#D9480F' : '#FF5A1F';
  const brandBgSoft = isLightMode
    ? 'bg-[#D9480F]/10 text-[#D9480F] border-[#D9480F]/25'
    : 'bg-[#FF5A1F]/15 text-[#FF5A1F] border-[#FF5A1F]/30';

  const cardBgClass = isLightMode
    ? 'bg-white border-[#D9D5CA] text-[#17181A]'
    : 'bg-[#181920] border-[#262833] text-[#F3F4F6]';

  const wellBgClass = isLightMode
    ? 'bg-[#ECE9E1] border-[#D9D5CA]'
    : 'bg-[#101115] border-[#262833]';

  const selectTheme = (next: ThemeType) => {
    setThemeState(next);
    localStorage.setItem('rakshak_theme', next);
  };

  const toggleTheme = () => {
    selectTheme(theme === 'tactical' ? 'stone' : 'tactical');
  };
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

  return (
    <div className={`w-[380px] min-h-[560px] max-h-[600px] flex flex-col font-sans select-none overflow-hidden border shadow-xl transition-colors ${
      isLightMode
        ? 'bg-[#F5F4EF] text-[#17181A] border-[#D9D5CA]'
        : 'bg-[#0C0D10] text-[#F3F4F6] border-[#262833]'
    }`}>

      {/* Extension Header: Brand & Identity */}
      <div className={`p-3.5 border-b space-y-2.5 ${
        isLightMode
          ? 'bg-white border-[#D9D5CA]'
          : 'bg-[#131418] border-[#262833]'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg text-white font-bold shadow-sm"
              style={{ backgroundColor: brandColor }}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-tight">Rakshak</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${brandBgSoft}`}>
                  Pre-Signing Shield
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={toggleTheme}
              title="Toggle Tactical / Stone Theme"
              className={`px-2 py-0.5 rounded border font-medium text-[11px] transition-colors ${
                isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-[#21232C] hover:bg-[#2C2F3B] border-[#343746] text-[#FF5A1F]'
              }`}
            >
              {isLightMode ? '🏛️ Stone' : '🔥 Tactical'}
            </button>

            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Active</span>
            </span>

            <button
              onClick={loadExtensionData}
              title="Sync Status"
              className={`p-1 rounded-md border transition-colors ${
                isLightMode ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-[#21232C] border-[#343746] text-slate-300 hover:bg-[#2C2F3B]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Wallet Address & Network Pill */}
        <div className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
          isLightMode ? 'bg-[#ECE9E1] border-[#D9D5CA]' : 'bg-[#101115] border-[#262833]'
        }`}>
          <div className="flex items-center gap-2 flex-1 min-w-0 font-mono">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border shrink-0 ${
              isLightMode ? 'bg-white border-[#D9D5CA] text-slate-700' : 'bg-[#21232C] border-[#343746] text-slate-300'
            }`}>
              {networkName}
            </span>

            {isEditingMetaMaskId ? (
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="text"
                  value={inputMetaMaskId}
                  onChange={(e) => setInputMetaMaskId(e.target.value)}
                  placeholder="0x... address"
                  className={`w-full border rounded px-2 py-0.5 text-xs focus:outline-none ${
                    isLightMode ? 'bg-white border-[#D9D5CA] text-[#17181A]' : 'bg-[#181920] border-[#262833] text-[#F3F4F6]'
                  }`}
                  autoFocus
                />
                <button
                  onClick={saveCustomMetaMaskId}
                  className="px-2 py-0.5 text-white rounded text-[10px] font-medium shrink-0"
                  style={{ backgroundColor: brandColor }}
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`font-medium text-xs truncate ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    {connectedWallet}
                  </span>
                  <button
                    onClick={() => setIsEditingMetaMaskId(true)}
                    title="Edit Wallet ID"
                    className="text-slate-400 hover:text-slate-600 p-0.5 transition-colors shrink-0"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(fullWalletAddress)}
                    title="Copy Address"
                    className="text-slate-400 hover:text-slate-600 p-0.5 transition-colors shrink-0"
                  >
                    {copiedAddress === fullWalletAddress ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold shrink-0 pl-1 font-mono">
                  {walletBalance}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Extension Navigation Tabs */}
      <div className={`flex border-b text-[11px] font-medium ${
        isLightMode ? 'border-[#D9D5CA] bg-white text-slate-500' : 'border-[#262833] bg-[#101115] text-slate-400'
      }`}>
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 py-2 flex items-center justify-center gap-1 border-b-2 transition-colors ${
            activeTab === 'home'
              ? 'font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
          style={activeTab === 'home' ? { borderColor: brandColor, color: brandColor } : {}}
        >
          <Home className="w-3.5 h-3.5" /> Shield
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 flex items-center justify-center gap-1 border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
          style={activeTab === 'history' ? { borderColor: brandColor, color: brandColor } : {}}
        >
          <Activity className="w-3.5 h-3.5" /> History ({evaluationsList.length})
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex-1 py-2 flex items-center justify-center gap-1 border-b-2 transition-colors ${
            activeTab === 'approvals'
              ? 'font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
          style={activeTab === 'approvals' ? { borderColor: brandColor, color: brandColor } : {}}
        >
          <Key className="w-3.5 h-3.5" /> Approvals
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 flex items-center justify-center gap-1 border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          style={activeTab === 'settings' ? { borderColor: brandColor, color: brandColor } : {}}
          title="Extension Settings"
        >
          <Sliders className="w-3.5 h-3.5" /> Settings
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5">

        {/* TAB 1: SHIELD (HOME) */}
        {activeTab === 'home' && (
          <div className="space-y-3">

            {/* Status Shield Card */}
            <div className={`p-4 rounded-xl border text-center relative overflow-hidden shadow-sm ${cardBgClass}`}>
              <div
                className="w-10 h-10 mx-auto rounded-xl border flex items-center justify-center mb-2 shadow-sm transition-colors"
                style={{
                  backgroundColor: isLightMode ? 'rgba(217, 72, 15, 0.10)' : 'rgba(255, 90, 31, 0.12)',
                  borderColor: isLightMode ? 'rgba(217, 72, 15, 0.25)' : 'rgba(255, 90, 31, 0.3)',
                  color: brandColor
                }}
              >
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div className={`text-xs font-semibold tracking-wide ${theme === 'stone' ? 'text-slate-900' : 'text-white'}`}>
                Real-Time Web3 Pre-Signing Firewall
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeDomain ? `Guarding ${activeDomain}` : 'Scanning EVM Provider'}
              </p>

              <div className={`mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-[10px] ${
                theme === 'stone' ? 'border-slate-100' : 'border-[#262833]'
              }`}>
                <div className={`p-2 rounded-lg border ${wellBgClass}`}>
                  <span className="text-slate-500 block uppercase font-medium">Threats Blocked</span>
                  <span className="text-rose-600 font-semibold text-sm">1 Drainer</span>
                </div>
                <div className={`p-2 rounded-lg border ${wellBgClass}`}>
                  <span className="text-slate-500 block uppercase font-medium">Isolation Forest</span>
                  <span className={`font-semibold text-sm ${backendOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {backendOnline ? 'Online (8000)' : 'Client Model'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Security Toggles */}
            <div className={`p-3 rounded-xl border space-y-2 text-xs shadow-sm ${cardBgClass}`}>
              <div className={`text-[10px] uppercase font-semibold pb-1 border-b ${
                theme === 'stone' ? 'text-slate-400 border-slate-100' : 'text-slate-500 border-[#262833]'
              }`}>
                Protection Protocols
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium ${theme === 'stone' ? 'text-slate-800' : 'text-slate-200'}`}>Auto-Quarantine Drainers</div>
                  <div className="text-[10px] text-slate-500">Blocks infinite token approvals (2^256-1)</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoBlockDrainers}
                  onChange={(e) => {
                    const newS = { ...settings, autoBlockDrainers: e.target.checked };
                    setSettings(newS);
                    setItem('thirdEyeSettings', newS);
                  }}
                  style={{ accentColor: brandColor }}
                  className="w-4 h-4 rounded cursor-pointer"
                />
              </div>

              <div className={`flex items-center justify-between pt-1.5 border-t ${
                theme === 'stone' ? 'border-slate-100' : 'border-[#262833]'
              }`}>
                <div>
                  <div className={`font-medium ${theme === 'stone' ? 'text-slate-800' : 'text-slate-200'}`}>Plain-English Explainability</div>
                  <div className="text-[10px] text-slate-500">Explains risk factors in natural language</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableAiExplanation}
                  onChange={(e) => {
                    const newS = { ...settings, enableAiExplanation: e.target.checked };
                    setSettings(newS);
                    setItem('thirdEyeSettings', newS);
                  }}
                  style={{ accentColor: brandColor }}
                  className="w-4 h-4 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* In-Extension Transaction Simulation Widget */}
            <div className={`p-3.5 rounded-xl border space-y-2.5 shadow-sm ${cardBgClass}`}>
              <div className={`flex items-center justify-between text-xs border-b pb-2 ${
                theme === 'stone' ? 'border-slate-100' : 'border-[#262833]'
              }`}>
                <span className={`font-semibold flex items-center gap-1.5 ${theme === 'stone' ? 'text-slate-900' : 'text-white'}`}>
                  <Send className="w-3.5 h-3.5" style={{ color: brandColor }} /> Test Transaction Sandbox
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  theme === 'stone' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-[#101115] text-slate-400 border-[#262833]'
                }`}>
                  Pre-Sign Test
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1 text-[10px]">Recipient Contract Address:</label>
                  <input
                    type="text"
                    value={recipientMetaMaskId}
                    onChange={(e) => setRecipientMetaMaskId(e.target.value)}
                    placeholder="0x... Target Address"
                    className={`w-full border rounded-lg px-2.5 py-1.5 font-mono text-xs focus:outline-none transition-colors ${
                      theme === 'stone' ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#101115] border-[#262833] text-slate-200'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 block mb-1 text-[10px]">Value (ETH):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sendAmountEth}
                      onChange={(e) => setSendAmountEth(e.target.value)}
                      className={`w-full border rounded-lg px-2.5 py-1.5 font-mono text-xs focus:outline-none transition-colors ${
                        theme === 'stone' ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#101115] border-[#262833] text-white'
                      }`}
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleInitiateTransaction}
                      disabled={txInitiating}
                      className="w-full py-1.5 text-white rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 shadow-sm hover:opacity-90 active:scale-[0.98]"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Send className="w-3 h-3" />
                      {txInitiating ? 'Evaluating...' : 'Simulate'}
                    </button>
                  </div>
                </div>

                {initiatedTxResult && (
                  <div className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                    initiatedTxResult.riskLevel === 'HIGH_RISK'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : initiatedTxResult.riskLevel === 'CAUTION'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    <div className="font-semibold flex items-center justify-between text-xs">
                      <span>{initiatedTxResult.oneSentenceSummary}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white shadow-sm font-mono">
                        {initiatedTxResult.riskScore}%
                      </span>
                    </div>
                    <div className="text-[11px] opacity-90">{initiatedTxResult.plainEnglishWhy}</div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="uppercase font-semibold">Transaction Audits</span>
              <span className="text-[10px] font-mono">{evaluationsList.length} Records</span>
            </div>

            <div className="space-y-2">
              {evaluationsList.map((tx) => {
                const isExpanded = expandedTxId === tx.txId;
                const isHighRisk = tx.riskLevel === 'HIGH_RISK' || tx.riskLevel === 'CRITICAL';
                const isCaution = tx.riskLevel === 'CAUTION' || tx.riskLevel === 'WARNING';

                return (
                  <div
                    key={tx.txId}
                    className={`rounded-xl border transition-colors overflow-hidden ${
                      isHighRisk
                        ? 'bg-rose-50/60 border-rose-200'
                        : isCaution
                          ? 'bg-amber-50/60 border-amber-200'
                          : cardBgClass
                    }`}
                  >
                    <div
                      onClick={() => setExpandedTxId(isExpanded ? '' : tx.txId)}
                      className="p-3 cursor-pointer flex items-start justify-between gap-2 hover:opacity-90 transition-colors"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {isHighRisk ? (
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        ) : isCaution ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-mono text-[10px]">
                            <span className={`font-semibold truncate ${theme === 'stone' ? 'text-slate-900' : 'text-white'}`}>{tx.txId}</span>
                            <span className="text-slate-400">• {formatTimeAgo(tx.interceptedAt || Date.now())}</span>
                          </div>
                          <div className={`text-xs font-medium truncate mt-0.5 ${theme === 'stone' ? 'text-slate-700' : 'text-slate-300'}`}>
                            {tx.oneSentenceSummary}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                          isHighRisk ? 'bg-rose-100 text-rose-800 border border-rose-200' : isCaution ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {tx.riskScore}%
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={`p-3 border-t space-y-2 text-xs ${
                        theme === 'stone' ? 'bg-slate-50 border-slate-100 text-slate-700' : 'bg-[#101115] border-[#262833] text-slate-300'
                      }`}>
                        <p className="leading-relaxed text-xs">
                          {tx.plainEnglishWhy}
                        </p>

                        <div className={`p-2 rounded-lg border text-[11px] font-mono space-y-1 ${
                          theme === 'stone' ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#181920] border-[#262833] text-slate-400'
                        }`}>
                          <div>Anomaly Score: <span className="font-semibold">{tx.isolationForestAnomalyScore}</span></div>
                          <div>Gas Ratio: <span>{tx.signals.gasPriorityFeeRatio}x</span> | Verified: <span>{tx.signals.contractIsVerified ? 'Yes' : 'No'}</span></div>
                          <div>Unlimited Allowance: <span className={tx.signals.isUnlimitedApproval ? 'text-rose-600 font-semibold' : 'text-emerald-600'}>{tx.signals.isUnlimitedApproval ? 'TRUE' : 'False'}</span></div>
                        </div>

                        {tx.actionableSafetyTip && (
                          <div className="text-xs text-slate-400 flex items-start gap-1.5 pt-1">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: brandColor }} />
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
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{approvalSuccessMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="uppercase font-semibold">Active Token Allowances</span>
              <span className="text-[10px]">Revoke drainer access</span>
            </div>

            {approvals.length === 0 ? (
              <div className={`p-5 rounded-xl border text-center space-y-2 shadow-sm ${cardBgClass}`}>
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <div className="text-xs font-semibold">All Allowances Revoked</div>
                <p className="text-xs text-slate-500">
                  No active token approvals found. Your wallet is safe from approval drainers.
                </p>
              </div>
            ) : (
              approvals.map((app) => {
                const isEditing = editingApprovalId === app.id;
                const isHigh = app.riskLevel === 'HIGH' || app.riskLevel === 'CRITICAL';

                return (
                  <div key={app.id} className={`p-3.5 rounded-xl border space-y-2.5 shadow-sm ${cardBgClass}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono text-xs font-semibold border ${
                          theme === 'stone' ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-[#21232C] text-slate-200 border-[#343746]'
                        }`}>
                          {app.tokenSymbol}
                        </span>
                        <span className="text-xs font-semibold">{app.spenderName}</span>
                      </div>

                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                        isHigh ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {app.riskLevel}
                      </span>
                    </div>

                    <div className={`p-2 rounded-lg border text-xs font-mono flex items-center justify-between ${wellBgClass}`}>
                      <span>Allowance:</span>
                      <span className={isHigh ? 'text-rose-600 font-semibold' : 'font-semibold'}>{app.allowance}</span>
                    </div>

                    {isEditing ? (
                      <div className={`p-2 rounded-lg border space-y-2 ${wellBgClass}`}>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customAllowanceVal}
                            onChange={(e) => setCustomAllowanceVal(e.target.value)}
                            placeholder="e.g. 10.0"
                            className={`flex-1 border rounded px-2 py-1 text-xs focus:outline-none font-mono ${
                              theme === 'stone' ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#181920] border-[#262833] text-white'
                            }`}
                          />
                          <button
                            onClick={() => handleGrantApproval(app)}
                            className="px-3 py-1 text-white rounded text-xs font-medium"
                            style={{ backgroundColor: brandColor }}
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
                          className={`py-1.5 px-2.5 border rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                            theme === 'stone' ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#21232C] hover:bg-[#2C2F3B] text-slate-200 border-[#343746]'
                          }`}
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> Adjust Limit
                        </button>

                        <button
                          onClick={() => handleRevoke(app)}
                          className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Revoke
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-3 text-xs font-sans">
            <div className={`p-3.5 rounded-xl border space-y-2.5 shadow-sm ${cardBgClass}`}>
              <div className="font-semibold text-xs uppercase text-slate-500 tracking-wide">Design Palette & Theme</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'tactical', label: '🔥 Tactical', desc: 'Obsidian & Safety Flame', color: '#FF5A1F' },
                  { id: 'stone', label: '🏛️ Stone', desc: 'Swiss Editorial Light', color: '#D9480F' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTheme(t.id as ThemeType)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      theme === t.id
                        ? 'font-medium shadow-sm'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: theme === t.id ? t.color : undefined,
                      backgroundColor: theme === t.id ? (isLightMode ? '#F5F4EF' : '#21232C') : undefined,
                      boxShadow: theme === t.id ? `0 0 0 1px ${t.color}` : undefined
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs">{t.label}</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }}></span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border space-y-2 shadow-sm ${cardBgClass}`}>
              <div className="font-semibold text-xs uppercase text-slate-500">ML Microservice Endpoint</div>
              <div className={`p-2 rounded-lg border font-mono text-xs ${wellBgClass}`}>
                {settings.customBackendUrl}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Model: scikit-learn IsolationForest</span>
                <span className={backendOnline ? 'text-emerald-600 font-semibold' : 'text-amber-600'}>
                  {backendOnline ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border space-y-2 shadow-sm ${cardBgClass}`}>
              <div className="font-semibold text-xs uppercase text-slate-500">Whitelisted dApp Domains</div>
              <div className="space-y-1 font-mono text-xs">
                {settings.whitelistedDomains.map((d, i) => (
                  <div key={i} className={`flex items-center justify-between p-1.5 rounded-lg border ${wellBgClass}`}>
                    <span>{d}</span>
                    <span className="text-emerald-600 text-[10px] font-semibold">VERIFIED</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Chrome Extension Sticky Footer */}
      <div className={`p-2.5 border-t text-[11px] flex items-center justify-between ${
        isLightMode
          ? 'bg-white border-[#D9D5CA] text-slate-500'
          : 'bg-[#131418] border-[#262833] text-slate-400'
      }`}>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>EVM Provider Protected</span>
        </span>
        <span className="font-mono">v1.2.4</span>
      </div>

    </div>
  );
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
