const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { getActiveApiEndpoint } = require('../models/database');

class AnimeApiService {
  constructor() {
    this.fallbackEndpointsPath = path.join(__dirname, '..', 'endpoint.json');
    this.apiResponsesPath = path.join(__dirname, '..', 'apiResponse');
    this._baseCache = { url: null, ts: 0 };
    this._baseTtlMs = 5 * 60 * 1000; // 5 minutes
  }
  async getApiBaseUrl() {
    // cached
    const now = Date.now();
    if (this._baseCache.url && (now - this._baseCache.ts) < this._baseTtlMs) {
      return this._baseCache.url;
    }
    const tried = new Set();
    const candidates = await this._getCandidates();
    for (const url of candidates) {
      if (!url || tried.has(url)) continue;
      tried.add(url);
      const ok = await this._ping(url);
      if (ok) {
        this._baseCache = { url, ts: now };
        return url;
      }
    }
    // fallback to first candidate or default
    const fallback = candidates[0] || 'https://arufanime-apis.vercel.app/v1';
    this._baseCache = { url: fallback, ts: now };
    return fallback;
  }

  async _getCandidates() {
    const list = [];
    const push = (u) => { if (u && !list.includes(u)) list.push(u.replace(/\/$/, '')); };
    try { push(process.env.EXTERNAL_API_BASE_URL || process.env.API_BASE_URL); } catch {}

    // Same-origin on Vercel (monorepo): https://<vercel-url>/v1
    if (process.env.VERCEL_URL) {
      push(`https://${process.env.VERCEL_URL}/v1`);
    }

    try {
      const dbUrl = await getActiveApiEndpoint();
      if (dbUrl) {
        const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\\d+)?(\/|$)/i.test(dbUrl);
        const allowLocal = process.env.ALLOW_LOCAL_API === '1' || process.env.NODE_ENV !== 'production';
        if (!isLocal || allowLocal) push(dbUrl);
      }
    } catch {}

    try {
      const endpointData = await fs.readFile(this.fallbackEndpointsPath, 'utf8');
      const endpoints = JSON.parse(endpointData);
      push(endpoints.base_url);
    } catch {}

    // default public API
    push('https://arufanime-apis.vercel.app/v1');
    return list;
  }

  async _ping(baseUrl) {
    try {
      const base = baseUrl.replace(/\/$/, '');
      // Try fast health endpoints
      const candidates = [`${base}/`, `${base}/home`];
      for (const url of candidates) {
        try {
          const res = await axios.get(url, { timeout: 2500, headers: { 'User-Agent': 'ArufaNime/1.0' } });
          if (res.status === 200) return true;
        } catch {}
      }
      return false;
    } catch {
      return false;
    }
  }

  async makeRequest(endpoint, params = {}) {
    try {
      let baseUrl = await this.getApiBaseUrl();
      const isAsset = /\.(?:png|jpe?g|gif|webp|svg|ico|css|js|map)$/i.test(endpoint);
      if (isAsset) throw Object.assign(new Error('Skip asset proxy'), { skip: true });

      let url = `${baseUrl}${endpoint}`;
      if (endpoint == '/ongoing-anime') {
        url = `${baseUrl}/ongoing-anime/${params.page}`;
      }

      const doGet = async (u) => axios.get(u, { params, timeout: 10000, headers: { 'User-Agent': 'ArufaNime/1.0' } });

      let response;
      try {
        response = await doGet(url);
      } catch (e1) {
        // try other bases before mock
        const candidates = await this._getCandidates();
        for (const cand of candidates) {
          if (!cand || cand === baseUrl) continue;
          const newUrl = endpoint === '/ongoing-anime' ? `${cand}/ongoing-anime/${params.page}` : `${cand}${endpoint}`;
          try {
            response = await doGet(newUrl);
            baseUrl = cand;
            this._baseCache = { url: cand, ts: Date.now() };
            break;
          } catch {}
        }
        if (!response) throw e1;
      }

      if (response.data && response.data.status === 'Ok') {
        if (endpoint === '/ongoing-anime' || endpoint.includes('/complete-anime') || endpoint.includes('/search') || endpoint.includes('/movies') || (response.data.anime && response.data.pagination)) {
          return response.data;
        }
        return response.data.data;
      }
      throw new Error('Invalid API response format');
    } catch (error) {
      // Respect 404: jangan fallback ke mock untuk detail endpoints
      const status = error?.response?.status;
  const isKnown = [/^\/home$/, /^\/ongoing-anime/, /^\/complete-anime/, /^\/genres(\/|$)/, /^\/search\//, /^\/movies\//, /^\/anime\//, /^\/episode\//].some(r => r.test(endpoint));
  // Never use mock for /anime/* and /episode/* to ensure slug-specific pages are real only
  const allowMock = [/^\/home$/, /^\/ongoing-anime/, /^\/complete-anime/, /^\/genres(\/|$)/, /^\/search\//, /^\/movies\//].some(r => r.test(endpoint));
      if (error?.skip) return null;
      if (status === 404) return null;
      if (!isKnown) return null;
      if (!allowMock) return null; // Jangan mock untuk /anime/* dan /episode/*
      return await this.loadMockData(endpoint, params);
    }
  }

  async loadMockData(endpoint, params = {}) {
    try {
      let filename;

      switch (endpoint) {
        case '/home':
          filename = 'v1_home.json';
          break;
        case '/ongoing-anime':
          filename = `v1_ongoing-anime_page.json`;
          break;
        case '/complete-anime':
          filename = `v1_complete-anime_page.json`;
          break;
        case '/genres':
          filename = 'v1_genres.json';
          break;
        case '/search':
          filename = 'v1_search_keyword.json';
          break;
        default:
          if (endpoint.includes('/anime/') && endpoint.includes('/episodes')) {
            filename = 'v1_anime_slug_episodes.json';
          } else if (endpoint.includes('/anime/')) {
            filename = 'v1_anime_slug.json';
          } else if (endpoint.includes('/episode/')) {
            filename = 'v1_episode_slug.json';
          } else {
            throw new Error(`No mock data available for endpoint: ${endpoint}`);
          }
      }

      const mockDataPath = path.join(this.apiResponsesPath, filename);
      const mockData = await fs.readFile(mockDataPath, 'utf8');
      const parsedData = JSON.parse(mockData);

      console.log(`Using mock data from: ${filename}`);
      return parsedData.data || parsedData;
    } catch (error) {
      console.error(`Failed to load mock data for ${endpoint}:`, error.message);
      return null;
    }
  }

  async getHomeData() {
    return await this.makeRequest('/home');
  }

  async getOngoingAnime(page = 1) {
    return await this.makeRequest('/ongoing-anime', { page });
  }

  async getCompleteAnime(page = 1) {
    return await this.makeRequest(`/complete-anime/${page}`);
  }

  async getMovies(page = 1) {
    return await this.makeRequest(`/movies/${page}`);
  }

  async getMovieDetails(year, month, slug) {
    return await this.makeRequest(`/movies/${year}/${month}/${slug}`);
  }

  async getAnimeDetails(slug) {
    return await this.makeRequest(`/anime/${slug}`);
  }

  async getAnimeEpisodes(slug) {
    return await this.makeRequest(`/anime/${slug}/episodes`);
  }

  async getEpisodeDetails(slug, episode) {
    return await this.makeRequest(`/anime/${slug}/episodes/${episode}`);
  }

  async searchAnime(keyword, page = 1) {
    return await this.makeRequest(`/search/${keyword}`, { keyword, page });
  }

  async getGenres() {
    return await this.makeRequest('/genres');
  }

  async getAnimeByGenre(genreSlug, page = 1) {
    return await this.makeRequest(`/genres/${genreSlug}/${page}`, { page });
  }

  validateAnimeData(data, slug = null) {
    if (!data) return null;
    const sanitized = {
      title: this.sanitizeString(data.title),
      slug: slug !== null ? slug : this.sanitizeSlug(data.slug),
      poster: this.sanitizeUrl(data.poster),
      synopsis: this.sanitizeString(data.synopsis),
      genres: Array.isArray(data.genres) ? data.genres : [],
      status: this.sanitizeString(data.status),
      rating: data.rating ? parseFloat(data.rating) : null,
      release_year: data.release_year ? parseInt(data.release_year) : null,
      episodes: Array.isArray(data.episode_lists) ? data.episode_lists : []
    };

    return sanitized;
  }

  sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  sanitizeUrl(url) {
    if (typeof url !== 'string') return '';
    try {
      new URL(url);
      return url;
    } catch {
      return '';
    }
  }

  sanitizeSlug(slug) {
    if (typeof slug !== 'string') return '';
    return slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
  }

  generateAnimeUrl(slug, episode = null) {
    const baseUrl = '/anime/' + this.sanitizeSlug(slug);
    return episode ? `${baseUrl}/episode/${episode}` : baseUrl;
  }
}

module.exports = new AnimeApiService();
