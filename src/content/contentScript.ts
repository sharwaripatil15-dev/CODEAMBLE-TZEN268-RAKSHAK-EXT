import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { OverlayModal } from './overlay/OverlayModal';
import { InterceptedRequest, RiskEvaluation } from '../shared/types';

console.log('👁️ [Third Eye] Content script active on page:', window.location.hostname);

// Step 1: Inject providerProxy.js into main DOM world
function injectScript() {
  try {
    const container = document.head || document.documentElement;
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = () => script.remove();
    container.insertBefore(script, container.children[0]);
  } catch (e) {
    console.error('👁️ [Third Eye] Failed to inject providerProxy:', e);
  }
}
injectScript();

// Step 2: Prepare Shadow DOM for Overlay Isolation
let shadowHost: HTMLElement | null = null;
let shadowRootContainer: ShadowRoot | null = null;
let reactRoot: Root | null = null;

function mountOverlay(evaluation: RiskEvaluation, onDecision: (action: 'APPROVE' | 'BLOCK') => void) {
  if (!shadowHost) {
    shadowHost = document.createElement('third-eye-security-root');
    shadowHost.style.position = 'fixed';
    shadowHost.style.zIndex = '2147483647';
    document.body.appendChild(shadowHost);
    shadowRootContainer = shadowHost.attachShadow({ mode: 'closed' });
  }

  if (!shadowRootContainer) return;

  const mountPoint = document.createElement('div');
  shadowRootContainer.appendChild(mountPoint);

  // Inject styles into shadow DOM
  const style = document.createElement('style');
  style.textContent = getOverlayStyles();
  shadowRootContainer.appendChild(style);

  reactRoot = createRoot(mountPoint);

  const handleAction = (action: 'APPROVE' | 'BLOCK') => {
    unmountOverlay();
    onDecision(action);
  };

  reactRoot.render(
    React.createElement(OverlayModal, {
      evaluation,
      onApprove: () => handleAction('APPROVE'),
      onBlock: () => handleAction('BLOCK')
    })
  );
}

function unmountOverlay() {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }
  if (shadowHost) {
    shadowHost.remove();
    shadowHost = null;
    shadowRootContainer = null;
  }
}

// Step 3: Listen for intercepted window messages from injected.js
window.addEventListener('message', async (event) => {
  if (event.source !== window || !event.data || event.data.source !== 'THIRD_EYE_INJECTED') {
    return;
  }

  if (event.data.type === 'INTERCEPT_REQUEST') {
    const req: InterceptedRequest = event.data.payload;

    // Request risk evaluation from background service worker
    chrome.runtime.sendMessage(
      { type: 'EVALUATE_TRANSACTION', payload: req },
      (response) => {
        if (!response || !response.success || !response.evaluation) {
          // If error, default fallback decision to pass
          window.postMessage(
            { source: 'THIRD_EYE_CONTENT', type: `INTERCEPT_RESPONSE_${req.id}`, action: 'APPROVE' },
            '*'
          );
          return;
        }

        const evaluation: RiskEvaluation = response.evaluation;

        // Mount security overlay for user confirmation
        mountOverlay(evaluation, (action) => {
          window.postMessage(
            { source: 'THIRD_EYE_CONTENT', type: `INTERCEPT_RESPONSE_${req.id}`, action },
            '*'
          );
        });
      }
    );
  }
});

function getOverlayStyles(): string {
  return `
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
  `;
}
