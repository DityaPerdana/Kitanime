import axios from 'axios';

// In-memory cache of the first working mirror
let workingBase = undefined;

const buildMirrorList = () => {
  // Prefer explicit BASEURL first if provided
  const primary = process.env.BASEURL ? [process.env.BASEURL.trim()] : [];

  // Allow comma-separated list via BASEURLS
  const fromEnvList = (process.env.BASEURLS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // Default known mirrors (ordered by likelihood to work)
  const defaults = [
    'https://otakudesu.cloud',
    'https://otakudesu.sbs',
    'https://otakudesu.best',
    'https://otakudesu.cam'
  ];

  // Build unique ordered list
  const all = [...primary, ...fromEnvList, ...defaults];
  return Array.from(new Set(all));
};

const MIRRORS = buildMirrorList();

const shouldFailover = (status) => {
  if (!status) return true; // network/timeout
  // Cloudflare or origin errors where trying another mirror may help
  return (
    status === 403 ||
    status === 429 ||
    status === 520 ||
    status === 521 ||
    status === 522 ||
    status === 523 ||
    status === 524 ||
    status === 525 ||
    status === 526 ||
    (status >= 500 && status < 600)
  );
};

export const getCurrentBase = () => workingBase ?? MIRRORS[0];

export async function fetchPath(path) {
  const rel = path?.startsWith('/') ? path : `/${path || ''}`;

  // Try cached working first, then others
  const candidates = workingBase
    ? [workingBase, ...MIRRORS.filter(m => m !== workingBase)]
    : [...MIRRORS];

  let lastErr;
  for (const base of candidates) {
    try {
      const url = `${base}${rel}`;
      const res = await axios.get(url);
      if (res.status >= 200 && res.status < 300) {
        if (workingBase !== base) {
          workingBase = base;
          console.log(`[mirror] Selected base: ${base}`);
        }
        return res.data;
      }
      lastErr = new Error(`Request failed with status ${res.status} for ${url}`);
      if (!shouldFailover(res.status)) throw lastErr;
    } catch (e) {
      lastErr = e;
      const status = e?.response?.status;
      if (!shouldFailover(status)) throw e;
      // else: try next mirror
      console.warn(`[mirror] Mirror failed (${status || e.code || 'ERR'}), trying next...`);
    }
  }
  throw lastErr ?? new Error('All mirrors failed');
}
