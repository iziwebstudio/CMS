// GET /api/posts
import { jsonResponse, errorResponse } from '../shared/utils.js';
import { getCachedRSSData } from '../shared/cache.js';
import { readConfigFromGitHub } from '../shared/github-config.js';

export async function onRequestGet(context) {
    const { env } = context;
    
    // Charger l'URL depuis config.json ou utiliser les variables d'environnement
    let feedUrl = env.BLOG_FEED_URL;
    try {
        const config = await readConfigFromGitHub(env);
        if (config && config.blogRssUrl) {
            feedUrl = config.blogRssUrl;
        }
    } catch (e) {
        console.log('Could not load config.json, using env vars');
    }

    if (!feedUrl) {
        return jsonResponse([]);
    }

    try {
        const blogData = await getCachedRSSData(feedUrl);
        return jsonResponse(blogData.posts);
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}
