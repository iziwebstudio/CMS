// GET /api/events
import { jsonResponse, errorResponse } from '../shared/utils.js';
import { getCachedEventsData } from '../shared/cache.js';
import { readConfigFromGitHub } from '../shared/github-config.js';

export async function onRequestGet(context) {
    const { env } = context;
    
    // Charger l'URL depuis config.json ou utiliser les variables d'environnement
    let feedUrl = env.EVENTS_FEED_URL;
    try {
        const config = await readConfigFromGitHub(env);
        if (config && config.eventsRssUrl) {
            feedUrl = config.eventsRssUrl;
        }
    } catch (e) {
        console.log('Could not load config.json, using env vars');
    }

    if (!feedUrl) {
        return jsonResponse([]);
    }

    try {
        const events = await getCachedEventsData(feedUrl);
        return jsonResponse(events);
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}

