import 'dotenv/config';
import scrapeGenreLists from '../lib/scrapeGenreLists.js';
import { fetchPath } from '../lib/mirrorClient.js';

const genreLists = async () => {
    const html = await fetchPath('/genre-list');
    const result = scrapeGenreLists(html);
    return result;
};
export default genreLists;
