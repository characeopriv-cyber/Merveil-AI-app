/**
 * Merveil runtime deps bridge — App.jsx calls bindMerveilDeps({...}) once
 * after defining shared helpers. Extracted modules read via deps / proxies.
 */
export const deps = {
  // filled by App
};

export function bindMerveilDeps(partial) {
  Object.assign(deps, partial || {});
}

/** Lazy function forwarders so extracts can call free names after bind. */
export function fwd(name) {
  return (...args) => {
    const fn = deps[name];
    if (typeof fn !== "function") throw new Error(`merveil deps.${name} not bound yet`);
    return fn(...args);
  };
}

export function getDep(name) {
  return deps[name];
}
