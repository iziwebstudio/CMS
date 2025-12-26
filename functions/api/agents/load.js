// ====================================================================
// Agent Load Endpoint
// ====================================================================
// Route: /api/agents/load (GET)
// Charge un agent depuis GitHub
// ====================================================================

import { jsonResponse, errorResponse } from '../../shared/utils.js';
import { isAuthenticated } from '../../shared/utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  
  // Seulement admin peut charger
  if (!isAuthenticated(request, env)) {
    return errorResponse("Non autorisé", 401);
  }
  
  // Vérifier la configuration GitHub
  if (!env.GITHUB_TOKEN || !env.GITHUB_USER || !env.GITHUB_REPO) {
    return errorResponse("Configuration GitHub manquante", 500);
  }
  
  try {
    const url = new URL(request.url);
    const agentId = url.searchParams.get('id');
    
    if (!agentId) {
      return errorResponse("Paramètre 'id' requis", 400);
    }
    
    const repo = `${env.GITHUB_USER}/${env.GITHUB_REPO}`;
    const path = `functions/agents/${agentId}.js`;
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'WebSuite'
      }
    });
    
    if (response.status === 404) {
      return errorResponse(`Agent not found: ${agentId}`, 404);
    }
    
    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.status}`);
    }
    
    const code = await response.text();
    
    return jsonResponse({
      success: true,
      agentId,
      code
    });
    
  } catch (error) {
    return errorResponse(`Erreur lors du chargement: ${error.message}`, 500);
  }
}
