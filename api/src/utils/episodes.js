import scrapeAnimeEpisodes from '../lib/scrapeAnimeEpisodes.js';
import { fetchPath } from '../lib/mirrorClient.js';
const episodes = async (slug) => {
    const data = await fetchPath(`/anime/${slug}`);
    const result = scrapeAnimeEpisodes(data);
    return result;
};
export default episodes;
