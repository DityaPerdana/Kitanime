import { load } from 'cheerio';
import pagination from '../lib/pagination.js';
import scrapeOngoingAnime from '../lib/scapeOngoingAnime.js';
import { fetchPath } from '../lib/mirrorClient.js';
const ongoingAnime = async (page = 1) => {
    const data = await fetchPath(`/ongoing-anime/page/${page}`);
    const $ = load(data);
    const ongoingAnimeEls = $('.venutama .rseries .rapi .venz ul li').toString();
    const ongoingAnimeData = scrapeOngoingAnime(ongoingAnimeEls);
    const paginationData = pagination($('.pagination').toString());
    return {
        paginationData,
        ongoingAnimeData
    };
};
export default ongoingAnime;
