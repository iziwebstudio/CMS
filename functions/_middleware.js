// ====================================================================
// MIDDLEWARE GLOBAL - Cloudflare Pages avec Proxy Webstudio + SSR HTMX
// ====================================================================
// Routing :
// - /api/*    → Functions locales (API)
// - /admin/*  → Dashboard admin local
// - /*        → Proxy vers Webstudio OU SSR avec frontend/index.html
// ====================================================================

import { corsHeaders } from './shared/utils.js';
import {
    isHtmxRequest,
    htmlResponse,
    extractTemplate,
    injectContent,
    generateOOB,
    generateHomeContent,
    generatePublicationsContent,
    generateVideosContent,
    handleHtmxCatchAll
} from './shared/htmx-render.js';

export async function onRequest(context) {
    const { request, next, env } = context;
    const url = new URL(request.url);

    // Gérer les requêtes OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    // Routes locales : /api/*, /admin/*, /core/*
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin/') || url.pathname.startsWith('/core/')) {
        // Si /api/* → continuer vers les handlers Functions
        if (url.pathname.startsWith('/api/')) {
            return next();
        }

        // Si /admin/* ou /core/* → servir les fichiers statiques locaux
        return env.ASSETS.fetch(request);
    }

    // ====================================================================
    // FRONTEND ROUTING - Priorité : Webstudio > SSR (frontend/index.html) > index.html racine
    // ====================================================================
    // Logique :
    // 1. Si WSTD_STAGING_URL défini → Proxy vers Webstudio
    // 2. Si WSTD_STAGING_URL non défini → SSR avec frontend/index.html comme template

    const WSTD_STAGING_URL = env.WSTD_STAGING_URL;

    // Si pas de WSTD_STAGING_URL, faire du SSR avec frontend/index.html
    if (!WSTD_STAGING_URL) {
        // Charger le template frontend/index.html
        const templateRequest = new Request(new URL('/frontend/index.html', request.url), request);
        const templateResponse = await env.ASSETS.fetch(templateRequest);
        
        let template = null;
        if (templateResponse.status === 200) {
            template = await templateResponse.text();
        } else {
            // Fallback : essayer index.html à la racine
            const rootIndexRequest = new Request(new URL('/index.html', request.url), request);
            const rootIndexResponse = await env.ASSETS.fetch(rootIndexRequest);
            if (rootIndexResponse.status === 200) {
                template = await rootIndexResponse.text();
            }
        }
        
        // Si aucun template trouvé, servir les assets normaux
        if (!template) {
            return env.ASSETS.fetch(request);
        }
        
        // Détecter si c'est une requête HTMX
        const isHtmx = isHtmxRequest(request);
        const path = url.pathname;
        
        // Configuration par défaut (peut être améliorée avec des variables d'env)
        const siteConfig = {
            site: { name: "StackPages CMS" },
            seo: {
                metaDescription: "",
                keywords: ""
            }
        };
        const siteName = siteConfig.site.name;
        const siteDescription = siteConfig.seo.metaDescription || "";
        const siteKeywords = siteConfig.seo.keywords || "";
        
        // Gérer la racine "/"
        if (path === '/' || path === '/index.html') {
            const metadata = {
                title: siteName,
                description: siteDescription,
                keywords: siteKeywords,
                siteName: siteName
            };
            const content = generateHomeContent(template, metadata);
            
            if (isHtmx) {
                return htmlResponse(content + generateOOB(metadata, request));
            }
            return htmlResponse(injectContent(template, content, metadata));
        }
        
        // Gérer les routes spéciales (annoucements, tutorials, etc.)
        if (path === '/annoucements' || path === '/publications') {
            // Pour l'instant, retourner juste le template (pas de données RSS)
            const tplContent = extractTemplate(template, 'tpl-annoucements');
            if (tplContent) {
                const metadata = {
                    title: `Announcements - ${siteName}`,
                    description: siteDescription,
                    keywords: siteKeywords
                };
                if (isHtmx) {
                    return htmlResponse(tplContent + generateOOB(metadata, request));
                }
                return htmlResponse(injectContent(template, tplContent, metadata));
            }
        }
        
        if (path === '/tutorials' || path === '/videos') {
            const tplContent = extractTemplate(template, 'tpl-tutorials');
            if (tplContent) {
                const metadata = {
                    title: `Video Tutorials - ${siteName}`,
                    description: siteDescription,
                    keywords: siteKeywords
                };
                if (isHtmx) {
                    return htmlResponse(tplContent + generateOOB(metadata, request));
                }
                return htmlResponse(injectContent(template, tplContent, metadata));
            }
        }
        
        // Catch-all pour les autres routes (serverless, get-started, etc.)
        // Fonctionne pour HTMX ET requêtes normales
        if (path.length > 1 && !path.startsWith('/api') && !path.startsWith('/admin') && !path.startsWith('/core')) {
            const slug = path.substring(1).replace(/\/$/, '');
            const tplId = `tpl-${slug}`;
            const tplContent = extractTemplate(template, tplId);
            
            if (tplContent) {
                // Template trouvé ! Générer les métadonnées
                const title = slug
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                
                const metadata = {
                    title: `${title} - ${siteName}`,
                    description: siteDescription,
                    keywords: siteKeywords,
                    siteName: siteName
                };
                
                if (isHtmx) {
                    // Requête HTMX : retourner juste le contenu + OOB
                    return htmlResponse(tplContent + generateOOB(metadata, request));
                } else {
                    // Requête normale : injecter dans le template complet
                    return htmlResponse(injectContent(template, tplContent, metadata));
                }
            }
        }
        
        // Si c'est une requête normale (pas HTMX) et qu'on a un template, 
        // injecter le contenu de la page d'accueil par défaut
        if (!isHtmx) {
            const metadata = {
                title: siteName,
                description: siteDescription,
                keywords: siteKeywords,
                siteName: siteName
            };
            // Injecter le contenu de la page d'accueil dans #main-content
            const homeContent = generateHomeContent(template, metadata);
            return htmlResponse(injectContent(template, homeContent, metadata));
        }
        
        // Fallback : servir les assets normaux (images, CSS, JS, etc.)
        return env.ASSETS.fetch(request);
    }

    try {
        // Construire l'URL Webstudio
        const webstudioUrl = new URL(url.pathname + url.search, WSTD_STAGING_URL);

        // Créer de nouveaux headers sans Referer/Origin du worker
        const proxyHeaders = new Headers(request.headers);
        proxyHeaders.delete('referer');
        proxyHeaders.delete('origin');
        proxyHeaders.set('host', new URL(WSTD_STAGING_URL).hostname);

        // Créer une nouvelle requête vers Webstudio
        const webstudioRequest = new Request(webstudioUrl, {
            method: request.method,
            headers: proxyHeaders,
            body: request.body,
            redirect: 'follow'
        });

        // Fetch depuis Webstudio
        const webstudioResponse = await fetch(webstudioRequest);

        // Créer de nouveaux headers avec CORS ajoutés
        const newHeaders = new Headers(webstudioResponse.headers);

        // Ajouter les headers CORS pour permettre le chargement cross-origin
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, X-Auth-Key');

        // Content Security Policy : autoriser images de TOUTES sources
        newHeaders.set('Content-Security-Policy',
            "default-src 'self'; " +
            "img-src * data: blob: 'unsafe-inline'; " +  // Toutes les images OK
            "media-src * data: blob:; " +                 // Toutes les vidéos OK
            "font-src * data:; " +                        // Toutes les polices OK
            "style-src 'self' 'unsafe-inline' *; " +     // Tous les styles OK
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' *; " + // Scripts OK
            "connect-src *; " +                           // Fetch/XHR vers toutes sources
            "frame-src *;"                                // iframes OK
        );

        // Supprimer le CSP restrictif existant si présent
        newHeaders.delete('X-Content-Security-Policy');
        newHeaders.delete('X-WebKit-CSP');


        // Pour TOUS les types de contenu (HTML, images, CSS, JS, etc.)
        // Retourner avec headers CORS
        return new Response(webstudioResponse.body, {
            status: webstudioResponse.status,
            statusText: webstudioResponse.statusText,
            headers: newHeaders
        });

    } catch (error) {
        console.error('Erreur proxy Webstudio:', error);

        // Fallback : servir index.html local si erreur
        return env.ASSETS.fetch(new Request(url.origin + '/index.html'));
    }
}