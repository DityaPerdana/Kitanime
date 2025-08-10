import episodes from './episodes.js';
import scrapeEpisode from '../lib/scrapeEpisode.js';
import { fetchPath } from '../lib/mirrorClient.js';
const episode = async ({ episodeSlug, animeSlug, episodeNumber }) => {
    let slug = '';
    console.log(episodeSlug, animeSlug, episodeNumber);
    if (episodeSlug)
        slug = episodeSlug;
    if (animeSlug) {
        const episodeLists = await episodes(animeSlug);
        if (!episodeLists)
            return undefined;
        const clean = episodeLists.map(ep => {
            const match = ep.episode.match(/Episode\s+(\d+)/i);
            const num = match ? match[1] : null;

            return {
              ...ep,
              episode: num
            };
        });
        const lowEps = clean[0].episode;
        const isFirst = lowEps === '0' && clean[1].slug.includes("-sub-indo-2");
        const split = clean[0].slug?.split('-episode-');
        const topPrefix = split[0];
        const topSuffix = split[1];
        const epNumPart = isFirst && episodeNumber === 1 ? '1-sub-indo-2' : `${episodeNumber == 0 ? 1 : episodeNumber}-sub-indo`;
        slug = `${topPrefix}-episode-${epNumPart}`;
        console.log(slug, episodeNumber)
    }
    const data = await fetchPath(`/episode/${slug}`);
    const result = await scrapeEpisode(data);
    return result;
};
export default episode;
