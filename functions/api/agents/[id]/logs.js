// ====================================================================
// Agent Logs Endpoint
// ====================================================================
// Route: /api/agents/[id]/logs (GET)
// Sécurité: Auth admin uniquement
// ====================================================================

import { jsonResponse, errorResponse } from '../../../shared/utils.js';
import { isAuthenticated } from '../../../shared/utils.js';
import { loadLogsFromGitHub } from '../../../shared/agent-executor.js';

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const { id } = params;
  
  // Seulement admin peut voir les logs
  if (!isAuthenticated(request, env)) {
    return errorResponse("Non autorisé", 401);
  }
  
  if (!env.GITHUB_TOKEN || !env.GITHUB_USER || !env.GITHUB_REPO) {
    return jsonResponse({ logs: [], message: 'Configuration GitHub manquante' });
  }
  
  try {
    const logs = await loadLogsFromGitHub(id, env);
    
    if (logs === null) {
      return jsonResponse({ 
        agentId: id, 
        logs: [], 
        message: 'Aucun log disponible' 
      });
    }
    
    return jsonResponse({
      agentId: id,
      logs,
      count: logs.length
    });
    
  } catch (error) {
    return errorResponse(`Erreur lors de la récupération des logs: ${error.message}`, 500);
  }
}
