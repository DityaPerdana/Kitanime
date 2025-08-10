import { load } from 'cheerio';
import pagination from '../lib/pagination.js';
import scrapeCompleteAnime from '../lib/scrapeCompleteAnime.js';
import { fetchPath } from '../lib/mirrorClient.js';

const completeAnime = async (page = 1) => {
    const data = await fetchPath(`/complete-anime/page/${page}`);
    const $ = load(data);
    const completeAnimeEls = $('.venutama .rseries .rapi .venz ul li').toString();
    const completeAnimeData = scrapeCompleteAnime(completeAnimeEls);
    const paginationData = pagination($('.pagination').toString());
    return {
        paginationData,
        completeAnimeData
    };
};
export default completeAnime;
