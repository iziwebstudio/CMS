// POST /api/translate - LibreTranslate API
import { corsHeaders, jsonResponse, errorResponse } from '../shared/utils.js';

/**
 * Liste des instances LibreTranslate publiques (fallback si une est down)
 */
const LIBRETRANSLATE_INSTANCES = [
    'https://translate.argosopentech.com/translate',
    'https://libretranslate.de/translate',
    'https://translate.fortytwo-it.com/translate'
];

/**
 * Traduit un texte en utilisant LibreTranslate
 */
async function translateWithLibreTranslate(text, targetLanguage, sourceLanguage = 'auto', instanceIndex = 0) {
    if (instanceIndex >= LIBRETRANSLATE_INSTANCES.length) {
        throw new Error('All LibreTranslate instances failed');
    }
    
    const instanceUrl = LIBRETRANSLATE_INSTANCES[instanceIndex];
    
    try {
        const response = await fetch(instanceUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                source: sourceLanguage === 'auto' ? 'auto' : sourceLanguage,
                target: targetLanguage,
                format: 'text'
            })
        });
        
        if (!response.ok) {
            // Si erreur, essayer l'instance suivante
            if (instanceIndex < LIBRETRANSLATE_INSTANCES.length - 1) {
                return translateWithLibreTranslate(text, targetLanguage, sourceLanguage, instanceIndex + 1);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        return {
            translatedText: data.translatedText,
            detectedLanguage: data.detectedSourceLanguage || sourceLanguage
        };
        
    } catch (error) {
        // Si erreur réseau, essayer l'instance suivante
        if (instanceIndex < LIBRETRANSLATE_INSTANCES.length - 1) {
            return translateWithLibreTranslate(text, targetLanguage, sourceLanguage, instanceIndex + 1);
        }
        throw error;
    }
}

export async function onRequestPost(context) {
    const { request } = context;
    
    // Gérer les requêtes OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    
    try {
        const body = await request.json();
        const { text, targetLanguage = 'fr', sourceLanguage = 'auto' } = body;
        
        if (!text || typeof text !== 'string') {
            return errorResponse("Text is required and must be a string", 400);
        }
        
        if (!targetLanguage) {
            return errorResponse("Target language is required", 400);
        }
        
        // Limiter la longueur du texte (éviter les abus)
        if (text.length > 5000) {
            return errorResponse("Text too long. Maximum 5000 characters.", 400);
        }
        
        // Traduire avec LibreTranslate
        const result = await translateWithLibreTranslate(text, targetLanguage, sourceLanguage);
        
        return jsonResponse({
            success: true,
            translatedText: result.translatedText,
            detectedLanguage: result.detectedLanguage,
            targetLanguage: targetLanguage,
            sourceLanguage: result.detectedLanguage
        });
        
    } catch (error) {
        console.error("Translation error:", error);
        return errorResponse(
            error.message || "Translation service unavailable. Please try again later.",
            500
        );
    }
}

// GET /api/translate/languages - Liste des langues supportées
export async function onRequestGet(context) {
    const { request } = context;
    
    try {
        // Essayer de récupérer les langues depuis une instance LibreTranslate
        const response = await fetch('https://translate.argosopentech.com/languages', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const languages = await response.json();
            return jsonResponse({
                success: true,
                languages: languages
            });
        }
        
        // Fallback: liste des langues courantes
        const fallbackLanguages = [
            { code: 'en', name: 'English' },
            { code: 'fr', name: 'Français' },
            { code: 'es', name: 'Español' },
            { code: 'de', name: 'Deutsch' },
            { code: 'it', name: 'Italiano' },
            { code: 'pt', name: 'Português' },
            { code: 'ru', name: 'Русский' },
            { code: 'ja', name: '日本語' },
            { code: 'zh', name: '中文' },
            { code: 'ar', name: 'العربية' }
        ];
        
        return jsonResponse({
            success: true,
            languages: fallbackLanguages
        });
        
    } catch (error) {
        console.error("Error fetching languages:", error);
        return errorResponse("Failed to fetch languages", 500);
    }
}

