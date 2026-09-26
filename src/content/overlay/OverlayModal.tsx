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
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans text-slate-100 select-none animate-fadeIn">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-[#070A12] border border-slate-800 shadow-2xl shadow-cyan-500/5 transition-all">
        
        {/* Header Banner */}
        <div className={`p-5 bg-gradient-to-r ${headerGradient} border-b border-slate-800 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${
              isCritical 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                : isWarning 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              {isCritical ? (
                <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
              ) : isWarning ? (
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold tracking-wider text-[11px] uppercase bg-cyan-950/80 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
                  RAKSHAK FIREWALL
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold uppercase ${badgeColor}`}>
                  {evaluation.riskLevel}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-1 tracking-tight">
                {isCritical ? 'Critical Security Threat Intercepted' : isWarning ? 'Transaction Caution Advised' : 'Verified Safe Interaction'}
              </h2>
            </div>
          </div>

          <div className="text-right font-mono shrink-0 pl-3">
            <div className={`text-2xl font-extrabold ${isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
              {evaluation.riskScore}<span className="text-xs text-slate-500">/100</span>
            </div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">RISK SCORE</div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {/* Isolation Forest Telemetry Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-cyan-400 font-mono">
              <span className="flex items-center gap-1.5 font-bold">
                <Cpu className="w-4 h-4 text-cyan-400" /> ISOLATION FOREST ML ENGINE
              </span>
              <span className="text-[11px] text-slate-400">ANOMALY: <span className="text-cyan-300 font-bold">{evaluation.isolationForestAnomalyScore}</span></span>
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

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
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
            <div className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2 ${
              isCritical
                ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
            }`}>
              <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{evaluation.actionableSafetyTip.replace(/^[💡🛑]\s*/, '')}</span>
            </div>
          )}

        </div>

        {/* Action Decision Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onBlock}
            className="flex-1 py-3 px-4 rounded-xl font-mono font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" /> BLOCK & QUARANTINE
          </button>

          <button
            onClick={onApprove}
            className={`px-4 py-3 rounded-xl font-mono font-bold text-xs transition-all flex items-center justify-center gap-2 ${
              isCritical
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> {isCritical ? 'Bypass' : 'Approve'}
          </button>
        </div>

      </div>
    </div>
  );
};
