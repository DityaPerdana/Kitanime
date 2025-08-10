import scrapeAnimeByGenre from '../lib/scrapeAnimeByGenre.js';
import { fetchPath } from '../lib/mirrorClient.js';
const animeByGenre = async (genre, page = 1) => {
    const html = await fetchPath(`/genres/${genre}/page/${page}`);
    const result = scrapeAnimeByGenre(html);
    return result;
};
export default animeByGenre;
