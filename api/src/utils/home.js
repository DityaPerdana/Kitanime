import { load } from 'cheerio';
import scrapeOngoingAnime from '../lib/scapeOngoingAnime.js';
import scrapeCompleteAnime from '../lib/scrapeCompleteAnime.js';
import { fetchPath } from '../lib/mirrorClient.js';

const home = async () => {
    const data = await fetchPath('');
    const $ = load(data);
    const ongoingAnimeEls = $('.venutama .rseries .rapi:first .venz ul li').toString();
    const completeAnimeEls = $('.venutama .rseries .rapi:last .venz ul li').toString();
    const ongoing_anime = scrapeOngoingAnime(ongoingAnimeEls);
    const complete_anime = scrapeCompleteAnime(completeAnimeEls);
    return {
        ongoing_anime,
        complete_anime
    };
};
export default home;
