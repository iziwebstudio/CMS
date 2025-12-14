// GET /api/post/[slug]
import { jsonResponse, errorResponse } from '../../shared/utils.js';
import { getCachedRSSData } from '../../shared/cache.js';
import { readConfigFromGitHub } from '../../shared/github-config.js';

export async function onRequestGet(context) {
    const { params, env } = context;
    const slug = params.slug;
    
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
        return errorResponse("No Blog RSS URL configured", 404);
    }

    try {
        const blogData = await getCachedRSSData(feedUrl);
        const post = blogData.posts.find(p => p.slug === slug);

        if (post) {
            return jsonResponse(post);
        } else {
            return errorResponse("Post not found", 404);
        }
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}
