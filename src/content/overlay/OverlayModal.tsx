import React from 'react';
import { RiskEvaluation, NetAssetChange } from '../../shared/types';
import { ShieldAlert, ShieldCheck, AlertTriangle, Cpu, CheckCircle2, XCircle, ArrowRightLeft, Lock, ArrowUpRight } from 'lucide-react';

interface OverlayModalProps {
  evaluation: RiskEvaluation;
  onApprove: () => void;
  onBlock: () => void;
}

export const OverlayModal: React.FC<OverlayModalProps> = ({ evaluation, onApprove, onBlock }) => {
  const isCritical = evaluation.riskLevel === 'CRITICAL' || evaluation.riskLevel === 'HIGH_RISK';
  const isWarning = evaluation.riskLevel === 'WARNING' || evaluation.riskLevel === 'CAUTION';

  const badgeColor = isCritical
    ? 'bg-rose-950/80 text-rose-400 border-rose-800'
    : isWarning
    ? 'bg-amber-950/80 text-amber-400 border-amber-800'
    : 'bg-emerald-950/80 text-emerald-400 border-emerald-800';

  const headerGradient = isCritical
    ? 'from-rose-950/50 via-slate-900 to-slate-950 border-rose-500/30'
    : isWarning
    ? 'from-amber-950/50 via-slate-900 to-slate-950 border-amber-500/30'
    : 'from-emerald-950/50 via-slate-900 to-slate-950 border-emerald-500/30';

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans text-slate-100 select-none animate-fadeIn">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-[#12151E] border border-slate-800 shadow-2xl transition-all">
        
        {/* Header Banner */}
        <div className={`p-4 bg-[#141824] border-b border-slate-800 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              isCritical 
                ? 'bg-rose-950/60 border-rose-800/80 text-rose-400' 
                : isWarning 
                ? 'bg-amber-950/60 border-amber-800/80 text-amber-400' 
                : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400'
            }`}>
              {isCritical ? (
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              ) : isWarning ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-white">
                  Rakshak Security Guard
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase ${badgeColor}`}>
                  {evaluation.riskLevel}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white mt-0.5 tracking-tight">
                {isCritical ? 'Security Threat Intercepted' : isWarning ? 'Transaction Caution Advised' : 'Verified Safe Interaction'}
              </h2>
            </div>
          </div>

          <div className="text-right font-mono shrink-0 pl-3">
            <div className={`text-xl font-bold ${isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
              {evaluation.riskScore}<span className="text-xs text-slate-500">/100</span>
            </div>
            <div className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Risk Score</div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
          
          {/* Isolation Forest Telemetry Card */}
          <div className="bg-[#0D0F15] border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
              <span className="flex items-center gap-1.5 font-medium">
                <Cpu className="w-3.5 h-3.5 text-blue-400" /> Isolation Forest Engine
              </span>
              <span className="text-[11px] text-slate-400">Score: <span className="text-slate-200 font-semibold">{evaluation.isolationForestAnomalyScore}</span></span>
            </div>
            
            {/* Visual Risk Gauge */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(evaluation.riskScore, 6)}%` }}
              />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {evaluation.aiExplanation || evaluation.plainEnglishWhy}
            </p>
          </div>

          {/* Asset Change Breakdown */}
          {evaluation.netAssetChanges && evaluation.netAssetChanges.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" /> SIMULATED ASSET IMPACT
              </h4>
              <div className="space-y-1.5">
                {evaluation.netAssetChanges.map((change: NetAssetChange, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs">
                    <span className="text-slate-300 font-medium">{change.asset}</span>
                    <span className={`font-mono font-bold ${
                      change.type === 'APPROVAL' ? 'text-rose-400' : change.type === 'OUT' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {change.type === 'APPROVAL' ? 'ALLOWANCE: ' : '- '}{change.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detected Anomaly Factors */}
          {evaluation.reasons && evaluation.reasons.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] uppercase font-mono tracking-wider text-slate-400">
                DETECTED THREAT SIGNALS
              </h4>
              <div className="space-y-1.5">
                {evaluation.reasons.map((reason: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80 font-mono">
                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isCritical ? 'text-rose-400' : 'text-amber-400'}`} />
                    <span className="leading-snug">{reason.replace(/^[🟢🟡🔴🚨⚠️]\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Safety Advisory */}
          {evaluation.actionableSafetyTip && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              isCritical
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}>
              <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{evaluation.actionableSafetyTip.replace(/^[💡🛑]\s*/, '')}</span>
            </div>
          )}

        </div>

        {/* Action Decision Footer */}
        <div className="p-4 bg-[#141824] border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onBlock}
            className="flex-1 py-2.5 px-4 rounded-xl font-medium text-xs bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" /> Block & Quarantine
          </button>

          <button
            onClick={onApprove}
            className={`px-4 py-2.5 rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-2 ${
              isCritical
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> {isCritical ? 'Proceed Anyway' : 'Approve'}
          </button>
        </div>

      </div>
    </div>
  );
};
