import scrapesearchresult from '../lib/scrapeSearchResult.js';
import { fetchPath } from '../lib/mirrorClient.js';
const search = async (keyword) => {
    const html = await fetchPath(`/?s=${keyword}&post_type=anime`);
    const searchResult = scrapesearchresult(html);
    return searchResult;
};
export default search;
