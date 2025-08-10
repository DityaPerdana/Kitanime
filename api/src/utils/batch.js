import { load } from 'cheerio';
import getBatch from '../lib/getBatch.js';
import { fetchPath } from '../lib/mirrorClient.js';
const batch = async ({ batchSlug, animeSlug }) => {
    let slug = '';
    if (batchSlug) slug = batchSlug;

    if (animeSlug) {
        const html = await fetchPath(`/anime/${animeSlug}`);
        const $ = load(html);
        const href = $('#batchLink').attr('href');
        slug = href ? href.split('/batch/').join('') : '';
    }

    if (!slug) return undefined;

    const html = await fetchPath(`/batch/${slug}`);
    const batchList = getBatch(html);
    return batchList;
};
export default batch;
