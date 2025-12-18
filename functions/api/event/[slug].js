// GET /api/event/:slug
import { jsonResponse, errorResponse } from '../../shared/utils.js';
import { getCachedEventsData } from '../../shared/cache.js';
import { readConfigFromGitHub } from '../../shared/github-config.js';

export async function onRequestGet(context) {
    const { env, params } = context;
    const slug = params.slug;
    
    if (!slug) {
        return errorResponse('Slug is required', 400);
    }
    
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
        return errorResponse('Events feed URL not configured', 404);
    }

    try {
        const events = await getCachedEventsData(feedUrl);
        const event = events.find(e => e.slug === slug);
        
        if (!event) {
            return errorResponse('Event not found', 404);
        }
        
        return jsonResponse(event);
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}

