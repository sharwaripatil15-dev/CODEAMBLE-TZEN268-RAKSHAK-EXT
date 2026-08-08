import{c as g,j as e,S as p,T as x,a as h,C as f,b as y,R as u}from"./assets/triangle-alert-CsTY0LZW.js";/**
 * @license lucide-react v0.474.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=[["path",{d:"m16 3 4 4-4 4",key:"1x1c3m"}],["path",{d:"M20 7H4",key:"zbl0bi"}],["path",{d:"m8 21-4-4 4-4",key:"h9nckh"}],["path",{d:"M4 17h16",key:"g4d7ey"}]],N=g("ArrowRightLeft",w);/**
 * @license lucide-react v0.474.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],E=g("CircleCheckBig",j);/**
 * @license lucide-react v0.474.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]],k=g("CircleX",v),C=({evaluation:r,onApprove:a,onBlock:d})=>{const t=r.riskLevel==="CRITICAL"||r.riskLevel==="HIGH_RISK",o=r.riskLevel==="WARNING"||r.riskLevel==="CAUTION",c=t?"bg-red-500/20 text-red-400 border-red-500/50":o?"bg-amber-500/20 text-amber-400 border-amber-500/50":"bg-emerald-500/20 text-emerald-400 border-emerald-500/50",b=t?"from-red-600/30 to-red-950/40 border-red-500/30":o?"from-amber-600/30 to-amber-950/40 border-amber-500/30":"from-emerald-600/30 to-emerald-950/40 border-emerald-500/30";return e.jsx("div",{className:"fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans text-gray-100 animate-fadeIn",children:e.jsxs("div",{className:"w-full max-w-lg overflow-hidden rounded-2xl bg-[#0B0F19] border border-gray-800 shadow-2xl shadow-cyan-500/10 transition-all",children:[e.jsxs("div",{className:`p-5 bg-gradient-to-r ${b} border-b flex items-center justify-between`,children:[e.jsxs("div",{className:"flex items-center gap-3",children:[t?e.jsx(p,{className:"w-8 h-8 text-red-400 animate-pulse"}):o?e.jsx(x,{className:"w-8 h-8 text-amber-400"}):e.jsx(h,{className:"w-8 h-8 text-emerald-400"}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"font-bold tracking-wider text-sm uppercase bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30",children:"THIRD EYE SHIELD"}),e.jsx("span",{className:`text-xs px-2 py-0.5 rounded-full border font-mono ${c}`,children:r.riskLevel})]}),e.jsx("h2",{className:"text-lg font-bold text-white mt-0.5",children:t?"High Threat Anomaly Blocked":o?"Caution Advised":"Verified Safe Interaction"})]})]}),e.jsxs("div",{className:"text-right font-mono",children:[e.jsxs("div",{className:"text-2xl font-extrabold text-white",children:[r.riskScore,e.jsx("span",{className:"text-xs text-gray-400",children:"/100"})]}),e.jsx("div",{className:"text-[10px] text-gray-400 uppercase tracking-wider",children:"THREAT SCORE"})]})]}),e.jsxs("div",{className:"p-6 space-y-5 max-h-[75vh] overflow-y-auto",children:[e.jsxs("div",{className:"bg-[#111827] border border-gray-800 rounded-xl p-4 space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between text-xs text-cyan-400 font-mono",children:[e.jsxs("span",{className:"flex items-center gap-1.5 font-bold",children:[e.jsx(f,{className:"w-4 h-4"})," ISOLATION FOREST ML ENGINE"]}),e.jsxs("span",{children:["ANOMALY SCORE: ",r.isolationForestAnomalyScore]})]}),e.jsx("div",{className:"w-full h-2 bg-gray-800 rounded-full overflow-hidden",children:e.jsx("div",{className:`h-full transition-all duration-500 ${t?"bg-red-500":o?"bg-amber-500":"bg-emerald-500"}`,style:{width:`${r.riskScore}%`}})}),e.jsx("p",{className:"text-xs text-gray-300 leading-relaxed font-sans",children:r.aiExplanation})]}),r.netAssetChanges.length>0&&e.jsxs("div",{children:[e.jsxs("h4",{className:"text-xs uppercase font-mono tracking-wider text-gray-400 mb-2 flex items-center gap-1.5",children:[e.jsx(N,{className:"w-3.5 h-3.5"})," EXPECTED ASSET IMPACT"]}),e.jsx("div",{className:"space-y-2",children:r.netAssetChanges.map((n,m)=>e.jsxs("div",{className:"flex items-center justify-between p-3 rounded-lg bg-gray-900/80 border border-gray-800 text-sm",children:[e.jsx("span",{className:"text-gray-300 font-medium",children:n.asset}),e.jsxs("span",{className:`font-mono font-bold ${n.type==="APPROVAL"?"text-red-400":n.type==="OUT"?"text-amber-400":"text-emerald-400"}`,children:[n.type==="APPROVAL"?"🛑 ALLOWANCE: ":"- ",n.amount]})]},m))})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-xs uppercase font-mono tracking-wider text-gray-400 mb-2",children:"THREAT SIGNALS DETECTED"}),e.jsx("div",{className:"space-y-1.5",children:r.reasons.map((n,m)=>e.jsxs("div",{className:"flex items-start gap-2 text-xs text-gray-300 bg-gray-900/40 p-2.5 rounded border border-gray-800/60",children:[e.jsx(x,{className:`w-4 h-4 shrink-0 mt-0.5 ${t?"text-red-400":"text-amber-400"}`}),e.jsx("span",{children:n})]},m))})]})]}),e.jsxs("div",{className:"p-4 bg-[#080B12] border-t border-gray-800 flex items-center justify-between gap-3",children:[e.jsxs("button",{onClick:d,className:"flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-red-600/90 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2",children:[e.jsx(k,{className:"w-4 h-4"})," BLOCK & PROTECT"]}),e.jsxs("button",{onClick:a,className:`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${t?"bg-gray-800 hover:bg-gray-700 text-gray-300":"bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"}`,children:[e.jsx(E,{className:"w-4 h-4"})," ",t?"Bypass & Allow":"Approve Transaction"]})]})]})})};console.log("👁️ [Third Eye] Content script active on page:",window.location.hostname);function T(){try{const r=document.head||document.documentElement,a=document.createElement("script");a.src=chrome.runtime.getURL("injected.js"),a.onload=()=>a.remove(),r.insertBefore(a,r.children[0])}catch(r){console.error("👁️ [Third Eye] Failed to inject providerProxy:",r)}}T();let s=null,i=null,l=null;function A(r,a){if(s||(s=document.createElement("third-eye-security-root"),s.style.position="fixed",s.style.zIndex="2147483647",document.body.appendChild(s),i=s.attachShadow({mode:"closed"})),!i)return;const d=document.createElement("div");i.appendChild(d);const t=document.createElement("style");t.textContent=I(),i.appendChild(t),l=y.createRoot(d);const o=c=>{R(),a(c)};l.render(u.createElement(C,{evaluation:r,onApprove:()=>o("APPROVE"),onBlock:()=>o("BLOCK")}))}function R(){l&&(l.unmount(),l=null),s&&(s.remove(),s=null,i=null)}window.addEventListener("message",async r=>{if(!(r.source!==window||!r.data||r.data.source!=="THIRD_EYE_INJECTED")&&r.data.type==="INTERCEPT_REQUEST"){const a=r.data.payload;chrome.runtime.sendMessage({type:"EVALUATE_TRANSACTION",payload:a},d=>{if(!d||!d.success||!d.evaluation){window.postMessage({source:"THIRD_EYE_CONTENT",type:`INTERCEPT_RESPONSE_${a.id}`,action:"APPROVE"},"*");return}const t=d.evaluation;A(t,o=>{window.postMessage({source:"THIRD_EYE_CONTENT",type:`INTERCEPT_RESPONSE_${a.id}`,action:o},"*")})})}});function I(){return`
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Inter:wght@400;600;700;800&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .fixed { position: fixed; }
    .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
    .z-\\[999999\\] { z-index: 999999; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .gap-1\\.5 { gap: 0.375rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .p-2\\.5 { padding: 0.625rem; }
    .p-3 { padding: 0.75rem; }
    .p-4 { padding: 1rem; }
    .p-5 { padding: 1.25rem; }
    .p-6 { padding: 1.5rem; }
    .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mt-0\\.5 { margin-top: 0.125rem; }
    .w-full { width: 100%; }
    .w-4 { width: 1rem; } .h-4 { height: 1rem; }
    .w-8 { width: 2rem; } .h-8 { height: 2rem; }
    .w-3\\.5 { width: 0.875rem; } .h-3\\.5 { height: 0.875rem; }
    .h-2 { height: 0.5rem; }
    .max-w-lg { max-width: 32rem; }
    .bg-black\\/80 { background-color: rgba(0, 0, 0, 0.85); }
    .bg-\\[\\#0B0F19\\] { background-color: #0B0F19; }
    .bg-\\[\\#111827\\] { background-color: #111827; }
    .bg-\\[\\#080B12\\] { background-color: #080B12; }
    .bg-red-600\\/90 { background-color: rgba(220, 38, 38, 0.9); }
    .bg-emerald-600 { background-color: #059669; }
    .bg-gray-800 { background-color: #1f2937; }
    .bg-gray-900\\/80 { background-color: rgba(17, 24, 39, 0.8); }
    .bg-cyan-950 { background-color: #083344; }
    .text-white { color: #ffffff; }
    .text-gray-100 { color: #f3f4f6; }
    .text-gray-300 { color: #d1d5db; }
    .text-gray-400 { color: #9ca3af; }
    .text-red-400 { color: #f87171; }
    .text-amber-400 { color: #fbbf24; }
    .text-emerald-400 { color: #34d399; }
    .text-cyan-400 { color: #22d3ee; }
    .font-sans { font-family: 'Inter', sans-serif; }
    .font-mono { font-family: 'Fira Code', monospace; }
    .font-bold { font-weight: 700; }
    .font-extrabold { font-weight: 800; }
    .font-medium { font-weight: 500; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.875rem; }
    .text-lg { font-size: 1.125rem; }
    .text-2xl { font-size: 1.5rem; }
    .rounded-2xl { border-radius: 1rem; }
    .rounded-xl { border-radius: 0.75rem; }
    .rounded-lg { border-radius: 0.5rem; }
    .rounded-full { border-radius: 9999px; }
    .border { border-width: 1px; }
    .border-b { border-bottom-width: 1px; }
    .border-t { border-top-width: 1px; }
    .border-gray-800 { border-color: #1f2937; }
    .border-cyan-500\\/30 { border-color: rgba(6, 182, 212, 0.3); }
    .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
    .from-red-600\\/30 { --tw-gradient-from: rgba(220, 38, 38, 0.3); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(220, 38, 38, 0)); }
    .to-red-950\\/40 { --tw-gradient-to: rgba(69, 10, 10, 0.4); }
    .from-emerald-600\\/30 { --tw-gradient-from: rgba(5, 150, 105, 0.3); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(5, 150, 105, 0)); }
    .to-emerald-950\\/40 { --tw-gradient-to: rgba(6, 78, 59, 0.4); }
    .from-amber-600\\/30 { --tw-gradient-from: rgba(217, 119, 6, 0.3); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(217, 119, 6, 0)); }
    .to-amber-950\\/40 { --tw-gradient-to: rgba(120, 53, 15, 0.4); }
    .space-y-2 > * + * { margin-top: 0.5rem; }
    .space-y-5 > * + * { margin-top: 1.25rem; }
    .flex-1 { flex: 1 1 0%; }
    .backdrop-blur-md { backdrop-filter: blur(12px); }
    .overflow-hidden { overflow: hidden; }
    .overflow-y-auto { overflow-y: auto; }
    .max-h-\\[75vh\\] { max-height: 75vh; }
    button { cursor: pointer; border: none; }
  `}
