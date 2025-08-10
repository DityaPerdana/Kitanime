import axios from 'axios';
import 'dotenv/config';
import scrapeGenreLists from '../lib/scrapeGenreLists.js';
const BASEURL = process.env.BASEURL   || 'https://otakudesu.best';
const genreLists = async () => {
    const response = await axios.get(`${BASEURL}/genre-list`);
    const result = scrapeGenreLists(response.data);
    return result;
};
export default genreLists;
