// GET /api/docs/:path
// Charge un fichier markdown et le retourne directement en HTML (via HTMX)
import { htmlResponse, errorResponse } from '../shared/utils.js';
import { loadDocAsHtml } from './docs-render.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    
    // Extraire le chemin depuis /api/docs/guide/quick-start -> /docs/guide/quick-start
    const pathMatch = url.pathname.match(/^\/api\/docs\/(.+)$/);
    if (!pathMatch) {
        return errorResponse('Path invalide', 400);
    }
    
    let docPath = `/docs/${pathMatch[1]}`;
    
    try {
        // Charger le markdown et le convertir en HTML
        const htmlContent = await loadDocAsHtml(env, docPath, url.origin);
        
        if (!htmlContent) {
            return errorResponse(`Fichier non trouvé: ${docPath}`, 404);
        }
        
        // Retourner directement le HTML (sera injecté dans #docs-content via fetch)
        return new Response(htmlContent, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=3600'
            }
        });
        
    } catch (error) {
        console.error('Error loading docs file:', error);
        return errorResponse(`Erreur lors du chargement: ${error.message}`, 500);
    }
}

