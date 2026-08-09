import React from 'react';
import { RiskEvaluation, NetAssetChange } from '../../shared/types';
import { ShieldAlert, ShieldCheck, AlertTriangle, Cpu, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react';

interface OverlayModalProps {
  evaluation: RiskEvaluation;
  onApprove: () => void;
  onBlock: () => void;
}

export const OverlayModal: React.FC<OverlayModalProps> = ({ evaluation, onApprove, onBlock }) => {
  const isCritical = evaluation.riskLevel === 'CRITICAL' || evaluation.riskLevel === 'HIGH_RISK';
  const isWarning = evaluation.riskLevel === 'WARNING' || evaluation.riskLevel === 'CAUTION';

  const badgeColor = isCritical
    ? 'bg-red-500/20 text-red-400 border-red-500/50'
    : isWarning
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';

  const headerGradient = isCritical
    ? 'from-red-600/30 to-red-950/40 border-red-500/30'
    : isWarning
    ? 'from-amber-600/30 to-amber-950/40 border-amber-500/30'
    : 'from-emerald-600/30 to-emerald-950/40 border-emerald-500/30';

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans text-gray-100 animate-fadeIn">
      <div className={`w-full max-w-lg overflow-hidden rounded-2xl bg-[#0B0F19] border border-gray-800 shadow-2xl shadow-cyan-500/10 transition-all`}>
        
        {/* Top Security Banner */}
        <div className={`p-5 bg-gradient-to-r ${headerGradient} border-b flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {isCritical ? (
              <ShieldAlert className="w-8 h-8 text-red-400 animate-pulse" />
            ) : isWarning ? (
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wider text-sm uppercase bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
                  RAKSHAK SHIELD
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${badgeColor}`}>
                  {evaluation.riskLevel}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {isCritical ? 'High Threat Anomaly Blocked' : isWarning ? 'Caution Advised' : 'Verified Safe Interaction'}
              </h2>
            </div>
          </div>

          <div className="text-right font-mono">
            <div className="text-2xl font-extrabold text-white">
              {evaluation.riskScore}<span className="text-xs text-gray-400">/100</span>
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">THREAT SCORE</div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Isolation Forest Anomaly Metric Card */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-cyan-400 font-mono">
              <span className="flex items-center gap-1.5 font-bold">
                <Cpu className="w-4 h-4" /> ISOLATION FOREST ML ENGINE
              </span>
              <span>ANOMALY SCORE: {evaluation.isolationForestAnomalyScore}</span>
            </div>
            
            {/* Visual Anomaly Gauge Bar */}
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${evaluation.riskScore}%` }}
              />
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              {evaluation.aiExplanation}
            </p>
          </div>

          {/* Asset Change Breakdown */}
          {evaluation.netAssetChanges.length > 0 && (
            <div>
              <h4 className="text-xs uppercase font-mono tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5" /> EXPECTED ASSET IMPACT
              </h4>
              <div className="space-y-2">
                {evaluation.netAssetChanges.map((change: NetAssetChange, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/80 border border-gray-800 text-sm">
                    <span className="text-gray-300 font-medium">{change.asset}</span>
                    <span className={`font-mono font-bold ${
                      change.type === 'APPROVAL' ? 'text-red-400' : change.type === 'OUT' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {change.type === 'APPROVAL' ? '🛑 ALLOWANCE: ' : '- '}{change.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anomaly Signal Reasons */}
          <div>
            <h4 className="text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">
              THREAT SIGNALS DETECTED
            </h4>
            <div className="space-y-1.5">
              {evaluation.reasons.map((reason: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-gray-300 bg-gray-900/40 p-2.5 rounded border border-gray-800/60">
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-[#080B12] border-t border-gray-800 flex items-center justify-between gap-3">
          <button
            onClick={onBlock}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-red-600/90 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" /> BLOCK & PROTECT
          </button>
          <button
            onClick={onApprove}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              isCritical
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
            }`}
          >
            <CheckCircle className="w-4 h-4" /> {isCritical ? 'Bypass & Allow' : 'Approve Transaction'}
          </button>
        </div>

      </div>
    </div>
  );
};
