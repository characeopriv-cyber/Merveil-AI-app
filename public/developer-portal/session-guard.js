/* Merveil Studio auth bridge.
 * Do not let a transient network/function wake-up render the Studio as Visitor.
 * 401/403 are real auth gates and must pass through unchanged.
 */
(() => {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const isAccessCheck = /\/api\/studio\?action=access(?:&|$)/.test(url);
    if (!isAccessCheck) return originalFetch(input, init);

    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await originalFetch(input, {
          ...init,
          credentials: 'include',
          cache: 'no-store',
        });
        if (response.status < 500 || attempt === 2) return response;
      } catch (error) {
        lastError = error;
        if (attempt === 2) throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 180 * (attempt + 1)));
    }
    throw lastError || new Error('Studio session check failed');
  };
})();
