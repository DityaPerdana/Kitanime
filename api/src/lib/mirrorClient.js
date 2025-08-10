import axios from 'axios';

// mirrorClient disabled: use single BASEURL only
const BASE = (process.env.BASEURL || 'https://otakudesu.best').trim();

export const getCurrentBase = () => BASE;

export async function fetchPath(path) {
  const rel = path?.startsWith('/') ? path : `/${path || ''}`;
  const url = `${BASE}${rel}`;
  const res = await axios.get(url, { headers: { Referer: BASE + '/' } });
  return res.data;
}
