// ====================================================================
// MIDDLEWARE GLOBAL - Cloudflare Pages
// ====================================================================
// Ce middleware gère :
// - Headers CORS (OPTIONS)
// - Passthrough des fichiers statiques (non-API)
// ====================================================================

import { corsHeaders } from './shared/utils.js';

export async function onRequest(context) {
    const { request, next, env } = context;

    // Gérer les requêtes OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    // Si ce n'est PAS une route /api/*, laisser Pages servir les fichiers statiques
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
        return env.ASSETS.fetch(request);
    }

    // Pour les routes /api/*, continuer vers les handlers spécifiques
    return next();
}