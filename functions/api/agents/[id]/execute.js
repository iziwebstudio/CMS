// ====================================================================
// Agent Execute Endpoint
// ====================================================================
// Route: /api/agents/[id]/execute (POST ou GET)
// Sécurité: Auth admin OU token CronJob
// ====================================================================

import { jsonResponse, errorResponse } from '../../../shared/utils.js';
import { isAuthenticated } from '../../../shared/utils.js';
import { loadAgentFromGitHub, executeAgent, saveLogToGitHub } from '../../../shared/agent-executor.js';

/**
 * Vérifie le token CronJob depuis le header ou query param
 */
function isValidCronJobToken(request, env) {
  const cronToken = request.headers.get('X-Cron-Token') || 
                    new URL(request.url).searchParams.get('token');
  const expectedToken = env.CRONJOB_API_KEY;
  
  if (!expectedToken) {
    return false; // Si pas de token configuré, on accepte seulement l'auth admin
  }
  
  return cronToken === expectedToken;
}

export async function onRequestPost(context) {
  return handleExecute(context);
}

export async function onRequestGet(context) {
  return handleExecute(context);
}

async function handleExecute(context) {
  const { request, env, params } = context;
  const { id } = params;
  
  // Vérification de sécurité : Auth admin OU token CronJob
  const isAdmin = isAuthenticated(request, env);
  const isCronJob = isValidCronJobToken(request, env);
  
  if (!isAdmin && !isCronJob) {
    return errorResponse("Non autorisé. Token CronJob ou authentification admin requise.", 401);
  }
  
  // Vérifier la configuration GitHub
  if (!env.GITHUB_TOKEN || !env.GITHUB_USER || !env.GITHUB_REPO) {
    return errorResponse("Configuration GitHub manquante", 500);
  }
  
  try {
    // 1. Charger l'agent depuis GitHub
    const agentCode = await loadAgentFromGitHub(id, env);
    
    // 2. Exécuter l'agent
    const startTime = Date.now();
    const result = await executeAgent(agentCode, env);
    const executionTime = Date.now() - startTime;
    
    // 3. Créer l'entrée de log
    const logEntry = {
      agentId: id,
      success: result.success !== false, // Par défaut true si pas défini
      executionTime,
      result: result,
      triggeredBy: isCronJob ? 'cronjob' : 'admin',
      timestamp: new Date().toISOString()
    };
    
    // 4. Sauvegarder le log (en arrière-plan, ne bloque pas la réponse)
    saveLogToGitHub(id, logEntry, env).catch(err => {
      console.error(`Failed to save log for agent ${id}:`, err);
    });
    
    // 5. Retourner le résultat
    return jsonResponse({
      success: true,
      agentId: id,
      executionTime,
      result: result,
      logged: true
    });
    
  } catch (error) {
    // Logger l'erreur aussi
    const errorLog = {
      agentId: id,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    saveLogToGitHub(id, errorLog, env).catch(err => {
      console.error(`Failed to save error log for agent ${id}:`, err);
    });
    
    return errorResponse(`Erreur d'exécution: ${error.message}`, 500);
  }
}
