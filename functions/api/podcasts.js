// GET /api/podcasts
import { jsonResponse, errorResponse } from '../shared/utils.js';
import { getCachedPodcastData } from '../shared/cache.js';
import { readConfigFromGitHub } from '../shared/github-config.js';

export async function onRequestGet(context) {
    const { env } = context;
    
    // Charger l'URL depuis config.json ou utiliser les variables d'environnement
    let feedUrl = env.PODCAST_FEED_URL;
    try {
        const config = await readConfigFromGitHub(env);
        if (config && config.podcastFeedUrl) {
            feedUrl = config.podcastFeedUrl;
        }
    } catch (e) {
        console.log('Could not load config.json, using env vars');
    }

    if (!feedUrl) {
        return jsonResponse([]);
    }

    try {
        const podcasts = await getCachedPodcastData(feedUrl);
        return jsonResponse(podcasts);
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}
