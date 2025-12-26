// ====================================================================
// Agent Save Endpoint
// ====================================================================
// Route: /api/agents/save (POST)
// Sauvegarde un agent sur GitHub
// ====================================================================

import { jsonResponse, errorResponse } from '../../shared/utils.js';
import { isAuthenticated } from '../../shared/utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  // Seulement admin peut sauvegarder
  if (!isAuthenticated(request, env)) {
    return errorResponse("Non autorisé", 401);
  }
  
  // Vérifier la configuration GitHub
  if (!env.GITHUB_TOKEN || !env.GITHUB_USER || !env.GITHUB_REPO) {
    return errorResponse("Configuration GitHub manquante", 500);
  }
  
  try {
    const body = await request.json();
    const { agentId, code, description } = body;
    
    if (!agentId || !code) {
      return errorResponse("agentId et code sont requis", 400);
    }
    
    // Valider que le code exporte bien une fonction agent
    if (!code.includes('export default') || !code.includes('function agent')) {
      return errorResponse("Le code doit exporter 'export default async function agent(context)'", 400);
    }
    
    const repo = `${env.GITHUB_USER}/${env.GITHUB_REPO}`;
    const path = `functions/agents/${agentId}.js`;
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;
    
    // Ajouter une description en commentaire si fournie
    let finalCode = code;
    if (description) {
      const comment = `/**
 * ${description}
 * Created: ${new Date().toISOString()}
 */

`;
      // Vérifier si le code a déjà des commentaires en haut
      if (!code.trim().startsWith('/**')) {
        finalCode = comment + code;
      }
    }
    
    const contentBase64 = btoa(unescape(encodeURIComponent(finalCode)));
    
    // Vérifier si le fichier existe pour obtenir le SHA
    let sha = null;
    try {
      const checkRes = await fetch(`${url}?ref=main`, {
        headers: {
          'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'WebSuite'
        }
      });
      
      if (checkRes.ok) {
        const data = await checkRes.json();
        sha = data.sha;
      }
    } catch (e) {
      // Fichier n'existe pas, on le crée
    }
    
    // Sauvegarder sur GitHub
    const githubBody = {
      message: sha ? `Update agent ${agentId}` : `Create agent ${agentId}`,
      content: contentBase64,
      branch: 'main'
    };
    if (sha) githubBody.sha = sha;
    
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'WebSuite'
      },
      body: JSON.stringify(githubBody)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`GitHub API Error: ${res.status} - ${errorText}`);
    }
    
    const result = await res.json();
    
    return jsonResponse({
      success: true,
      agentId,
      path: result.content.path,
      sha: result.content.sha,
      message: sha ? 'Agent mis à jour' : 'Agent créé'
    });
    
  } catch (error) {
    return errorResponse(`Erreur lors de la sauvegarde: ${error.message}`, 500);
  }
}
