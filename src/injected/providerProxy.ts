// Injected script running in the webpage main world context
(function () {
  console.log('👁️ [Third Eye] Injected Provider Proxy active.');

  const INTERCEPTED_METHODS = [
    'eth_sendTransaction',
    'eth_signTypedData',
    'eth_signTypedData_v4',
    'personal_sign',
    'eth_sign'
  ];

  function setupProxy() {
    const provider = (window as any).ethereum;
    if (!provider || provider.__thirdEyeProxied) return;

    provider.__thirdEyeProxied = true;
    const originalRequest = provider.request;

    provider.request = async function (args: { method: string; params?: any[] }) {
      if (!args || !INTERCEPTED_METHODS.includes(args.method)) {
        return originalRequest.apply(this, arguments as any);
      }

      const txId = 'tx_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      const originDomain = window.location.hostname;

      console.log(`👁️ [Third Eye] Intercepting ${args.method} (${txId}) on ${originDomain}`);

      return new Promise((resolve, reject) => {
        // Send request to content script via window postMessage
        window.postMessage(
          {
            source: 'THIRD_EYE_INJECTED',
            type: 'INTERCEPT_REQUEST',
            payload: {
              id: txId,
              type: mapMethodToType(args.method),
              method: args.method,
              params: args.params,
              originDomain,
              timestamp: Date.now()
            }
          },
          '*'
        );

        // Listen for resolution from content script overlay decision
        const handleMessage = (event: MessageEvent) => {
          if (
            event.source !== window ||
            !event.data ||
            event.data.source !== 'THIRD_EYE_CONTENT' ||
            event.data.type !== `INTERCEPT_RESPONSE_${txId}`
          ) {
            return;
          }

          window.removeEventListener('message', handleMessage);

          if (event.data.action === 'APPROVE') {
            console.log(`✅ [Third Eye] Transaction ${txId} approved by user/extension. Forwarding to wallet.`);
            originalRequest
              .apply(provider, [args])
              .then(resolve)
              .catch(reject);
          } else {
            console.warn(`🛑 [Third Eye] Transaction ${txId} BLOCKED by Third Eye Security.`);
            reject({
              code: 4001,
              message: 'Transaction rejected by user (Blocked by Third Eye Web3 Security Guard).'
            });
          }
        };

        window.addEventListener('message', handleMessage);
      });
    };
  }

  function mapMethodToType(method: string): string {
    switch (method) {
      case 'eth_sendTransaction':
        return 'ETH_SEND_TX';
      case 'eth_signTypedData':
      case 'eth_signTypedData_v4':
        return 'ETH_SIGN_TYPED_DATA';
      case 'personal_sign':
        return 'PERSONAL_SIGN';
      default:
        return 'ETH_SIGN';
    }
  }

  // Attempt setup immediately & on DOM load
  setupProxy();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupProxy);
  } else {
    setupProxy();
  }

  // Also observe if window.ethereum is injected later by extension wallets
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if ((window as any).ethereum && !(window as any).ethereum.__thirdEyeProxied) {
      setupProxy();
      clearInterval(interval);
    }
    if (attempts > 20) clearInterval(interval);
  }, 250);
})();
