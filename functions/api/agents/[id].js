// ====================================================================
// Agent Info Endpoint (Route directe)
// ====================================================================
// Route: /api/agents/[id] (GET)
// Retourne les informations de l'agent
// Pour l'exécution, utiliser /api/agents/[id]/execute
// ====================================================================

import { jsonResponse, errorResponse } from '../../shared/utils.js';
import { isAuthenticated } from '../../shared/utils.js';

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const { id } = params;
  
  // Seulement admin peut voir les infos
  if (!isAuthenticated(request, env)) {
    return errorResponse("Non autorisé", 401);
  }
  
  if (!env.GITHUB_TOKEN || !env.GITHUB_USER || !env.GITHUB_REPO) {
    return errorResponse("Configuration GitHub manquante", 500);
  }
  
  try {
    const repo = `${env.GITHUB_USER}/${env.GITHUB_REPO}`;
    const path = `functions/agents/${id}.js`;
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'WebSuite'
      }
    });
    
    if (response.status === 404) {
      return errorResponse(`Agent not found: ${id}`, 404);
    }
    
    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.status}`);
    }
    
    const fileData = await response.json();
    
    return jsonResponse({
      id: id,
      name: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      path: fileData.path,
      sha: fileData.sha,
      size: fileData.size,
      download_url: fileData.download_url,
      lastModified: fileData.last_modified || fileData.updated_at
    });
    
  } catch (error) {
    return errorResponse(`Erreur lors de la récupération de l'agent: ${error.message}`, 500);
  }
}
