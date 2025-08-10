import scrapeSingleAnime from '../lib/scrapeSingleAnime.js';
import { fetchPath } from '../lib/mirrorClient.js';

const anime = async (slug) => {
    const data = await fetchPath(`/anime/${slug}`);
    const result = scrapeSingleAnime(data);
    return result;
};
export default anime;
