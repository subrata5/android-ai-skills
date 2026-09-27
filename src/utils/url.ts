/**
  * Builds a relative URL respecting Astro's configured BASE_URL for GitHub Pages deployment.
  * @param path Target internal path e.g. '/skills' or '/skills/jetpack-compose-ui'
  * @returns Formatted URL with base path prefix
  */
export function buildUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
