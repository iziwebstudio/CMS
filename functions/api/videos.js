// GET /api/videos
import { jsonResponse } from '../shared/utils.js';
import { getCachedYoutubeData } from '../shared/cache.js';
import { readConfigFromGitHub } from '../shared/github-config.js';

export async function onRequestGet(context) {
    const { env } = context;
    
    // Charger l'URL depuis config.json ou utiliser les variables d'environnement
    let feedUrl = env.YOUTUBE_FEED_URL;
    try {
        const config = await readConfigFromGitHub(env);
        if (config && config.youtubeRssUrl) {
            feedUrl = config.youtubeRssUrl;
        }
    } catch (e) {
        console.log('Could not load config.json, using env vars');
    }

    if (!feedUrl) {
        return jsonResponse([]);
    }

    try {
        const videos = await getCachedYoutubeData(feedUrl);
        return jsonResponse(videos);
    } catch (error) {
        console.error("Error fetching YouTube RSS:", error);
        return jsonResponse([]);
    }
}
