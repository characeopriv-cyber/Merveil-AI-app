/* Merveil Studio auth bridge.
 * A Citizen session can still be settling while navigation moves from
 * junction.technology to developer.junction.technology. Keep the access
 * check pending briefly instead of allowing Studio to bounce back or show
 * Visitor during that handoff.
 */
(() => {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const isAccessCheck = /\/api\/studio\?action=access(?:&|$)/.test(url);
    if (!isAccessCheck) return originalFetch(input, init);

    let lastError;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const response = await originalFetch(input, {
          ...init,
          credentials: 'include',
          cache: 'no-store',
        });

        // 5xx and 401 can both be transient during the cross-subdomain
        // Citizen -> Developer session handoff. 403 is deliberately final:
        // it means the server has identified the citizen but the Passport
        // requirement is not satisfied.
        const retryable = response.status >= 500 || response.status === 401;
        if (!retryable || attempt === 4) return response;
      } catch (error) {
        lastError = error;
        if (attempt === 4) throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 220 * (attempt + 1)));
    }

    throw lastError || new Error('Studio session check failed');
  };
})();
