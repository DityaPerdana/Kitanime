import axios from 'axios';
import scrapeAnimeByGenre from '../lib/scrapeAnimeByGenre.js';
const BASEURL = process.env.BASEURL   || 'https://otakudesu.best';
const animeByGenre = async (genre, page = 1) => {
    const response = await axios.get(`${BASEURL}/genres/${genre}/page/${page}`);
    const result = scrapeAnimeByGenre(response.data);
    return result;
};
export default animeByGenre;
