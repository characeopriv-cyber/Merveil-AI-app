/* Merveil Studio auth bridge.
 * Developer-only: never clears, refreshes, logs out, or modifies the Citizen session.
 * Wait for the existing Citizen Supabase session and forward its current access token.
 */
(() => {
  const originalFetch = window.fetch.bind(window);

  function currentAuthHeader() {
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        const raw = key ? localStorage.getItem(key) : null;
        if (!raw || !raw.includes('access_token')) continue;
        try {
          const data = JSON.parse(raw);
          const token = data?.access_token || data?.currentSession?.access_token || data?.session?.access_token;
          if (typeof token === 'string' && token.split('.').length === 3) {
            return { Authorization: `Bearer ${token}` };
          }
        } catch {}
      }
    } catch {}
    return {};
  }

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const isAccessCheck = /\/api\/studio(?:\?action=access)?(?:&|$)/.test(url);
    if (!isAccessCheck) return originalFetch(input, init);

    let lastError;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const headers = new Headers(init.headers || {});
        const auth = currentAuthHeader();
        if (auth.Authorization) headers.set('Authorization', auth.Authorization);

        const response = await originalFetch(input, {
          ...init,
          headers,
          credentials: 'include',
          cache: 'no-store',
        });

        const retryable = response.status === 401 || response.status >= 500;
        if (!retryable || attempt === 7) return response;
      } catch (error) {
        lastError = error;
        if (attempt === 7) throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }

    throw lastError || new Error('Studio session check failed');
  };
})();
