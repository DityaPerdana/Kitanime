const express = require('express');
const router = express.Router();
const axios = require('axios');
const animeApi = require('../services/animeApi');

router.get('/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    const animeData = await animeApi.getAnimeDetails(slug);

    if (!animeData) {
      return res.status(404).render('error', {
        title: 'Anime Tidak Ditemukan - ArufaNime',
        error: {
          status: 404,
          message: 'Anime yang Anda cari tidak ditemukan'
        }
      });
    }

    const sanitizedAnime = animeApi.validateAnimeData(animeData, slug);
    const clean = sanitizedAnime.episodes.map(ep => {
      const match = ep.episode.match(/Episode\s+(\d+)/i);
      const num = match ? match[1] : null;

      return {
        ...ep,
        episode: num
      };
    });
    sanitizedAnime.episodes = clean;
    res.render('anime-detail', {
      title: `${sanitizedAnime.title} - ArufaNime`,
      description: sanitizedAnime.synopsis ?
        sanitizedAnime.synopsis.substring(0, 160) + '...' :
        `Nonton ${sanitizedAnime.title} subtitle Indonesia`,
      anime: sanitizedAnime,
      currentPage: 'anime'
    });
  } catch (error) {
    console.error('Anime detail page error:', error);
    res.status(500).render('error', {
      title: 'Terjadi Kesalahan - ArufaNime',
      error: {
        status: 500,
        message: 'Tidak dapat memuat detail anime'
      }
    });
  }
});

router.get('/:slug/episodes', async (req, res) => {
  try {
    const slug = req.params.slug;
    const [animeData, episodesData] = await Promise.all([
      animeApi.getAnimeDetails(slug),
      animeApi.getAnimeEpisodes(slug)
    ]);

    if (!animeData) {
      return res.status(404).render('error', {
        title: 'Anime Tidak Ditemukan - ArufaNime',
        error: {
          status: 404,
          message: 'Anime yang Anda cari tidak ditemukan'
        }
      });
    }

    const sanitizedAnime = animeApi.validateAnimeData(animeData, slug);
    const clean = sanitizedAnime.episodes.map(ep => {
      const match = ep.episode.match(/Episode\s+(\d+)/i);
      const num = match ? match[1] : null;

      return {
        ...ep,
        episode: num
      };
    });
    res.render('anime-episodes', {
      title: `Episode ${sanitizedAnime.title} - ArufaNime`,
      description: `Daftar episode ${sanitizedAnime.title} subtitle Indonesia`,
      anime: sanitizedAnime,
      episodes: clean || [],
      currentPage: 'anime'
    });
  } catch (error) {
    console.error('Anime episodes page error:', error);
    res.status(500).render('error', {
      title: 'Terjadi Kesalahan - ArufaNime',
      error: {
        status: 500,
        message: 'Tidak dapat memuat daftar episode'
      }
    });
  }
});

router.get('/:slug/episode/:episode', async (req, res) => {
  try {
    const slug = req.params.slug;
    const episodeNumber = req.params.episode;

    const [animeData, episodeData] = await Promise.all([
      animeApi.getAnimeDetails(slug),
      animeApi.getEpisodeDetails(slug, episodeNumber)
    ]);

    if (!animeData || !episodeData) {
      return res.status(404).render('error', {
        title: 'Episode Tidak Ditemukan - ArufaNime',
        error: {
          status: 404,
          message: 'Episode yang Anda cari tidak ditemukan'
        }
      });
    }

    const sanitizedAnime = animeApi.validateAnimeData(animeData, slug);

    const allEpisodes = episodeData.all_episodes || [];
    const currentEpisodeIndex = allEpisodes.findIndex(ep =>
      ep.episode_number == episodeNumber
    );
    const getEpisodeDetails = await animeApi.getEpisodeDetails(slug, episodeNumber);

    const prevEpisode = currentEpisodeIndex > 0 ?
      allEpisodes[currentEpisodeIndex - 1] : parseInt(episodeNumber) - 1;
    const nextEpisode = currentEpisodeIndex < allEpisodes.length - 1 ?
      allEpisodes[currentEpisodeIndex + 1] : parseInt(episodeNumber) + 1;
    var episodeDatas = {
        title: `${sanitizedAnime.title} Episode ${episodeNumber} - ArufaNime`,
        description: `Nonton ${sanitizedAnime.title} Episode ${episodeNumber} subtitle Indonesia`,
        anime: sanitizedAnime,
        episode: {
          number: episodeNumber,
          title: episodeData.episode_title || `Episode ${episodeNumber}`,
          video_sources: `/stream?url=${getEpisodeDetails.stream_url}` || [],
          subtitles: episodeData.stream_url || [],
          download_links: getEpisodeDetails.download_urls || []
        },
        navigation: {
          prev: prevEpisode,
          next: nextEpisode,
          all_episodes: sanitizedAnime.episodes
        },
        currentPage: 'anime'
    }
    console.log(episodeDatas);
    res.render('episode-player', episodeDatas);
  } catch (error) {
    console.error('Episode player page error:', error);
    res.status(500).render('error', {
      title: 'Terjadi Kesalahan - ArufaNime',
      error: {
        status: 500,
        message: 'Tidak dapat memuat episode'
      }
    });
  }
});

router.get('/:slug/batch', async (req, res) => {
  try {
    const slug = req.params.slug;
    const animeData = await animeApi.getAnimeDetails(slug);

    if (!animeData) {
      return res.status(404).render('error', {
        title: 'Anime Tidak Ditemukan - ArufaNime',
        error: {
          status: 404,
          message: 'Anime yang Anda cari tidak ditemukan'
        }
      });
    }

    const sanitizedAnime = animeApi.validateAnimeData(animeData, slug);

    res.render('anime-batch', {
      title: `Download Batch ${sanitizedAnime.title} - ArufaNime`,
      description: `Download batch ${sanitizedAnime.title} subtitle Indonesia`,
      anime: sanitizedAnime,
      batchLinks: animeData.batch_links || [],
      currentPage: 'anime'
    });
  } catch (error) {
    console.error('Batch download page error:', error);
    res.status(500).render('error', {
      title: 'Terjadi Kesalahan - ArufaNime',
      error: {
        status: 500,
        message: 'Tidak dapat memuat halaman batch download'
      }
    });
  }
});

module.exports = router;
