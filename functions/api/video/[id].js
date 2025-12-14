// GET /api/video/[id]
import { jsonResponse, errorResponse } from '../../shared/utils.js';
import { getCachedYoutubeData } from '../../shared/cache.js';
import { readConfigFromGitHub } from '../../shared/github-config.js';

export async function onRequestGet(context) {
    const { params, env } = context;
    const videoId = params.id;
    
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
        return errorResponse("Flux YouTube non configuré", 404);
    }

    try {
        const videos = await getCachedYoutubeData(feedUrl);
        const video = videos.find(v => v.id === videoId);

        if (video) {
            return jsonResponse(video);
        } else {
            return errorResponse("Vidéo non trouvée", 404);
        }
    } catch (error) {
        console.error("Error fetching YouTube RSS:", error);
        return errorResponse(error.message, 500);
    }
}
