// POST /api/translate - DeepL Translation API
import { corsHeaders, jsonResponse, errorResponse } from '../shared/utils.js';

/**
 * Mappe les codes de langue vers les codes DeepL
 */
function mapLanguageToDeepL(langCode) {
    const langMap = {
        'en': 'EN',
        'fr': 'FR',
        'es': 'ES',
        'de': 'DE',
        'it': 'IT',
        'pt': 'PT',
        'ru': 'RU',
        'ja': 'JA',
        'zh': 'ZH',
        'ar': 'AR',
        'pl': 'PL',
        'nl': 'NL',
        'sv': 'SV',
        'da': 'DA',
        'fi': 'FI',
        'cs': 'CS',
        'hu': 'HU',
        'ro': 'RO',
        'bg': 'BG',
        'sk': 'SK',
        'sl': 'SL',
        'et': 'ET',
        'lv': 'LV',
        'lt': 'LT',
        'mt': 'MT',
        'el': 'EL'
    };
    return langMap[langCode.toLowerCase()] || 'EN';
}

/**
 * Traduit un texte en utilisant DeepL API
 */
async function translateWithDeepL(text, targetLanguage, sourceLanguage = 'auto', context = null) {
    try {
        // Récupérer la clé API depuis les variables d'environnement
        const apiKey = context?.env?.DEEPL_API_KEY || process.env.DEEPL_API_KEY;
        
        if (!apiKey) {
            throw new Error('DeepL API key not configured. Please set DEEPL_API_KEY environment variable.');
        }
        
        // Mapper les codes de langue vers DeepL
        const targetLang = mapLanguageToDeepL(targetLanguage);
        const sourceLang = sourceLanguage === 'auto' ? null : mapLanguageToDeepL(sourceLanguage);
        
        // DeepL API endpoint
        const apiUrl = 'https://api-free.deepl.com/v2/translate';
        
        // Préparer les paramètres
        const params = new URLSearchParams({
            'auth_key': apiKey,
            'text': text,
            'target_lang': targetLang
        });
        
        if (sourceLang) {
            params.append('source_lang', sourceLang);
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString(),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            // Gérer spécifiquement le rate limiting (429)
            if (response.status === 429) {
                throw new Error(`Rate limit exceeded. Please wait before making more requests.`);
            }
            // Gérer les erreurs de quota (456)
            if (response.status === 456) {
                throw new Error(`Quota exceeded. Monthly character limit reached.`);
            }
            const errorText = await response.text();
            throw new Error(`DeepL API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.translations && data.translations.length > 0) {
            return {
                translatedText: data.translations[0].text,
                detectedLanguage: data.translations[0].detected_source_language || sourceLanguage
            };
        }
        
        throw new Error('DeepL API returned invalid response');
        
    } catch (error) {
        console.error('DeepL translation error:', error.message);
        throw error;
    }
}

export async function onRequestPost(context) {
    const { request } = context;
    
    // Gérer les requêtes OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    
    // Ajouter des logs pour le débogage
    console.log('Translation request received');
    
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
        
        // Traduire avec DeepL API
        console.log(`[DeepL] Translating: "${text.substring(0, 50)}..." to ${targetLanguage}`);
        const result = await translateWithDeepL(text, targetLanguage, sourceLanguage, context);
        console.log(`[DeepL] Translation result: "${result.translatedText.substring(0, 50)}..."`);
        
        return jsonResponse({
            success: true,
            translatedText: result.translatedText,
            detectedLanguage: result.detectedLanguage,
            targetLanguage: targetLanguage,
            sourceLanguage: result.detectedLanguage,
            service: 'DeepL'
        });
        
    } catch (error) {
        console.error("Translation error:", error);
        console.error("Error stack:", error.stack);
        
        // Retourner une erreur plus détaillée pour le débogage
        const errorMessage = error.message || "Translation service unavailable. Please try again later.";
        return errorResponse(
            {
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            500
        );
    }
}

// GET /api/translate/languages - Liste des langues supportées
export async function onRequestGet(context) {
    const { request } = context;
    
    try {
        // DeepL supporte 31 langues, retourner la liste des langues supportées
        const supportedLanguages = [
            { code: 'en', name: 'English' },
            { code: 'fr', name: 'Français' },
            { code: 'es', name: 'Español' },
            { code: 'de', name: 'Deutsch' },
            { code: 'it', name: 'Italiano' },
            { code: 'pt', name: 'Português' },
            { code: 'ru', name: 'Русский' },
            { code: 'ja', name: '日本語' },
            { code: 'zh', name: '中文' },
            { code: 'pl', name: 'Polski' },
            { code: 'nl', name: 'Nederlands' },
            { code: 'sv', name: 'Svenska' },
            { code: 'da', name: 'Dansk' },
            { code: 'fi', name: 'Suomi' },
            { code: 'cs', name: 'Čeština' },
            { code: 'hu', name: 'Magyar' },
            { code: 'ro', name: 'Română' },
            { code: 'bg', name: 'Български' },
            { code: 'sk', name: 'Slovenčina' },
            { code: 'sl', name: 'Slovenščina' },
            { code: 'el', name: 'Ελληνικά' }
        ];
        
        return jsonResponse({
            success: true,
            languages: supportedLanguages
        });
        
    } catch (error) {
        console.error("Error fetching languages:", error);
        return errorResponse("Failed to fetch languages", 500);
    }
}

