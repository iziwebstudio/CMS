// ====================================================================
// IDE CONTEXT - Contexte enrichi pour la génération de code
// ====================================================================
// Ce fichier contient le contexte système pour améliorer la génération
// de code dans l'IDE pour les modes HTMX et Agents IA
// ====================================================================

export const IDE_CONTEXT = {
  
  // ==================================================================
  // CONTEXTE MODE HTMX - Sites & Templates
  // ==================================================================
  htmxContext: `
# ARCHITECTURE WEBSUITE CMS - MODE HTMX

## SYSTÈME "SUPER TEMPLATE" - SSR avec HTMX
WebSuite utilise un système unique où le backend (Cloudflare Worker) gère le Server-Side Rendering (SSR) 
en utilisant des balises HTML <template> standard. Le rendu se fait côté serveur, pas côté client.

## RÈGLES CRITIQUES:
1. **PAS DE Rendu Client-Side**: Ne JAMAIS écrire du JavaScript pour récupérer du JSON et construire du HTML.
   Le backend fait ça pour vous automatiquement.

2. **Utiliser les Balises <template>**: Vous DEVEZ définir ces templates dans votre HTML:
   - <template id="tpl-home">: Contenu de la page d'accueil par défaut
   - <template id="tpl-blog-card">: Structure HTML pour une carte d'article de blog
   - <template id="tpl-video-card">: Structure HTML pour une carte de vidéo
   - <template id="tpl-event-card">: Structure HTML pour une carte d'événement
   - <template id="tpl-post-detail">: Layout pour voir un article complet
   - <template id="tpl-video-detail">: Layout pour voir une vidéo complète
   - <template id="tpl-tutorials">: Section pour les tutoriels vidéos
   - <template id="tpl-events">: Section pour les événements
   - <template id="tpl-announcements">: Section pour les annonces/blog

3. **Utiliser HTMX**: Utiliser les attributs HTMX pour la navigation et le chargement dynamique:
   - Navigation: <a href="/posts" hx-get="/posts" hx-target="#main-content" hx-push-url="true">
   - Chargement automatique: <div hx-get="/api/posts" hx-trigger="load" hx-target="#publications-container">
   - Formulaires: <form hx-post="/api/submit" hx-target="#result">
   - Boutons: <button hx-get="/load" hx-target="#content">

4. **Tailwind CSS**: Utiliser Tailwind CSS pour TOUT le styling. Pas de CSS inline personnalisé sauf animations.

5. **Dark Mode**: Toujours supporter le dark mode avec les classes Tailwind:
   - Utiliser dark:bg-slate-900 pour les backgrounds
   - Utiliser dark:text-slate-50 pour les textes
   - Utiliser dark:border-slate-700 pour les bordures

## PLACEHOLDERS DANS LES TEMPLATES:
Dans vos balises <template>, utilisez ces placeholders que le backend remplacera:
- Blog Card: {{title}}, {{image}}, {{description}}, {{date}}, {{slug}}, {{author}}, {{link}}
- Video Card: {{title}}, {{thumbnail}}, {{date}}, {{link}}, {{slug}}
- Event Card: {{title}}, {{image}}, {{date}}, {{location}}, {{slug}}, {{link}}
- Post Detail: {{title}}, {{image}}, {{content}}, {{date}}, {{author}}

## STRUCTURE HTML REQUISE:
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>{{site-title}}</title>
    <script src="/static/js/tailwindcss.js"></script>
    <script src="/static/js/htmx.min.js"></script>
    <link rel="stylesheet" href="/static/css/all.min.css">
</head>
<body>
    <main id="main-content">
        <!-- Le contenu sera injecté ici par HTMX -->
    </main>
    
    <!-- Tous vos templates ici -->
    <template id="tpl-home">...</template>
    <template id="tpl-blog-card">...</template>
</body>
</html>

## EXEMPLES DE PATTERNS:

### Pattern 1: Navigation HTMX
<a href="/posts" 
   hx-get="/posts" 
   hx-target="#main-content" 
   hx-push-url="true"
   class="text-purple-600 hover:text-purple-800">
   Articles
</a>

### Pattern 2: Chargement automatique
<div id="publications-container" 
     hx-get="/api/posts" 
     hx-trigger="load" 
     hx-target="this">
</div>

### Pattern 3: Template de carte blog
<template id="tpl-blog-card">
    <a href="/post/{{slug}}" 
       hx-get="/post/{{slug}}" 
       hx-target="#main-content" 
       hx-push-url="true"
       class="group flex bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 hover:shadow-xl transition">
        <img src="{{image}}" alt="{{title}}" class="w-80 h-56 object-cover group-hover:scale-105 transition">
        <div class="p-6">
            <span class="text-purple-500 text-sm">{{date}}</span>
            <h3 class="text-2xl font-bold mt-2">{{title}}</h3>
            <p class="text-gray-600 dark:text-slate-300 line-clamp-2">{{description}}</p>
        </div>
    </a>
</template>

### Pattern 4: Section avec fond animé (neon glow)
<section class="relative py-20 bg-gray-50 dark:bg-slate-950 overflow-hidden">
    <div class="pointer-events-none absolute inset-0 opacity-40 dark:opacity-70">
        <div class="absolute -top-24 left-1/4 w-64 h-64 bg-purple-500/40 blur-3xl rounded-full animate-pulse-slow"></div>
        <div class="absolute bottom-0 right-0 w-80 h-80 bg-fuchsia-500/25 blur-3xl rounded-full animate-pulse-slower"></div>
    </div>
    <div class="container mx-auto px-6 relative z-10">
        <!-- Contenu ici -->
    </div>
</section>

## INTERDICTIONS:
- ❌ Ne PAS utiliser fetch() + innerHTML pour construire du HTML
- ❌ Ne PAS écrire du JavaScript complexe pour le rendu
- ❌ Ne PAS utiliser des frameworks JS (React, Vue, etc.)
- ❌ Ne PAS oublier le support dark mode
- ❌ Ne PAS utiliser de CSS inline sauf pour animations spécifiques
`,

  // ==================================================================
  // CONTEXTE MODE AGENTS IA - Scripts automatisés
  // ==================================================================
  agentContext: `
# ARCHITECTURE WEBSUITE CMS - MODE AGENTS IA

## SYSTÈME D'AGENTS AUTOMATISÉS
Les agents sont des fonctions JavaScript qui s'exécutent automatiquement via CronJob.org 
ou manuellement depuis l'interface admin. Ils ont accès uniquement aux variables d'environnement.

## FORMAT OBLIGATOIRE:

### Structure de base:
\`\`\`javascript
export default async function agent(context) {
    const { env } = context;
    
    try {
        // Votre logique ici
        const result = await doSomething(env);
        
        return {
            success: true,
            message: "Opération réussie",
            timestamp: new Date().toISOString(),
            data: result
        };
    } catch (error) {
        return {
            success: false,
            message: \`Erreur: \${error.message}\`,
            timestamp: new Date().toISOString(),
            data: null
        };
    }
}
\`\`\`

## RÈGLES CRITIQUES:

1. **Paramètre context**: L'agent reçoit toujours un objet \`context\` contenant:
   - \`context.env\`: Toutes les variables d'environnement
   - \`context.request\`: L'objet Request (si appelé via HTTP)
   - \`context.params\`: Paramètres de route (si applicable)

2. **Variables d'environnement**: Accéder UNIQUEMENT via \`env.VARIABLE_NAME\`
   - Exemple: \`const token = env.GITHUB_TOKEN\`
   - Toujours vérifier si la variable existe avant utilisation

3. **Format de retour**: Retourner TOUJOURS un objet avec:
   - \`success\`: boolean
   - \`message\`: string descriptif
   - \`timestamp\`: ISO string
   - \`data\`: les données (optionnel)

4. **Gestion d'erreurs**: TOUJOURS utiliser try/catch et retourner un format d'erreur cohérent

5. **Pas d'accès fichiers**: Les agents NE PEUVENT PAS accéder au système de fichiers
   - Utiliser uniquement des APIs externes ou internes
   - Stocker les logs via GitHub API si nécessaire

6. **APIs internes**: Utiliser les routes API internes pour le contenu:
   - Articles: \`fetch('/api/posts')\` - NE PAS utiliser \`env.BLOG_FEED_URL\` directement
   - Vidéos: \`fetch('/api/videos')\` - NE PAS utiliser \`env.YOUTUBE_FEED_URL\` directement
   - Podcasts: \`fetch('/api/podcasts')\` - NE PAS utiliser \`env.PODCAST_FEED_URL\` directement
   - Événements: \`fetch('/api/events')\` - NE PAS utiliser \`env.EVENTS_FEED_URL\` directement

## EXEMPLES DE PATTERNS:

### Pattern 1: Agent qui récupère des articles
\`\`\`javascript
export default async function agent(context) {
    const { env } = context;
    
    try {
        // Utiliser l'API interne, pas l'URL RSS directement
        const response = await fetch('/api/posts');
        if (!response.ok) throw new Error(\`API error: \${response.status}\`);
        
        const posts = await response.json();
        
        return {
            success: true,
            message: \`Récupéré \${posts.length} articles\`,
            timestamp: new Date().toISOString(),
            data: posts
        };
    } catch (error) {
        return {
            success: false,
            message: \`Erreur: \${error.message}\`,
            timestamp: new Date().toISOString(),
            data: null
        };
    }
}
\`\`\`

### Pattern 2: Agent avec Google Apps Script
\`\`\`javascript
export default async function agent(context) {
    const { env } = context;
    
    if (!env.APPSCRIPT_GMAIL_URL) {
        return {
            success: false,
            message: "APPSCRIPT_GMAIL_URL non définie",
            timestamp: new Date().toISOString()
        };
    }
    
    try {
        const response = await fetch(env.APPSCRIPT_GMAIL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow', // CRITICAL pour Google Apps Script
            body: JSON.stringify({
                action: 'send',
                to: 'recipient@example.com',
                subject: 'Email Subject',
                body: 'Email body'
            })
        });
        
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            throw new Error('Google Apps Script returned HTML instead of JSON');
        }
        
        const result = await response.json();
        if (result.status !== 'success') {
            throw new Error(\`Email failed: \${result.message}\`);
        }
        
        return {
            success: true,
            message: "Email envoyé avec succès",
            timestamp: new Date().toISOString(),
            data: result
        };
    } catch (error) {
        return {
            success: false,
            message: \`Erreur: \${error.message}\`,
            timestamp: new Date().toISOString()
        };
    }
}
\`\`\`

### Pattern 3: Agent avec Google AI (Gemini)
\`\`\`javascript
export default async function agent(context) {
    const { env } = context;
    
    if (!env.GOOGLE_AI_KEY) {
        return { success: false, message: "GOOGLE_AI_KEY non définie" };
    }
    
    try {
        const apiKey = env.GOOGLE_AI_KEY;
        const url = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${apiKey}\`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Your prompt here" }]
                }]
            })
        });
        
        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        return {
            success: true,
            message: "Texte généré",
            timestamp: new Date().toISOString(),
            data: { text: generatedText }
        };
    } catch (error) {
        return {
            success: false,
            message: \`Erreur: \${error.message}\`,
            timestamp: new Date().toISOString()
        };
    }
}
\`\`\`

### Pattern 4: Agent qui traite et agrège des données
\`\`\`javascript
export default async function agent(context) {
    const { env } = context;
    
    try {
        // Récupérer plusieurs sources
        const [posts, videos, events] = await Promise.all([
            fetch('/api/posts').then(r => r.json()),
            fetch('/api/videos').then(r => r.json()),
            fetch('/api/events').then(r => r.json())
        ]);
        
        // Traiter les données
        const summary = {
            totalPosts: posts.length,
            totalVideos: videos.length,
            totalEvents: events.length,
            latestPost: posts[0]?.title || 'Aucun',
            latestVideo: videos[0]?.title || 'Aucune'
        };
        
        return {
            success: true,
            message: "Résumé généré",
            timestamp: new Date().toISOString(),
            data: summary
        };
    } catch (error) {
        return {
            success: false,
            message: \`Erreur: \${error.message}\`,
            timestamp: new Date().toISOString()
        };
    }
}
\`\`\`

## INTERDICTIONS:
- ❌ Ne PAS utiliser \`new Function()\` ou \`eval()\`
- ❌ Ne PAS accéder au système de fichiers
- ❌ Ne PAS utiliser des URLs RSS directement (utiliser /api/*)
- ❌ Ne PAS oublier \`redirect: 'follow'\` pour Google Apps Script
- ❌ Ne PAS retourner autre chose qu'un objet avec success/message/timestamp
- ❌ Ne PAS utiliser \`gemini-pro\` (utiliser \`gemini-2.5-flash\` ou \`gemini-1.5-pro\`)
`,

  // ==================================================================
  // PATTERNS COMMUNS
  // ==================================================================
  commonPatterns: {
    htmx: {
      navigation: `<a href="/route" hx-get="/route" hx-target="#main-content" hx-push-url="true">Link</a>`,
      dataLoading: `<div hx-get="/api/data" hx-trigger="load" hx-target="#container"></div>`,
      forms: `<form hx-post="/api/submit" hx-target="#result" hx-swap="innerHTML">...</form>`,
      buttons: `<button hx-get="/load" hx-target="#content" class="btn">Load</button>`,
      darkMode: `bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-50`,
      card: `class="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 hover:shadow-xl transition"`
    },
    agents: {
      basicStructure: `export default async function agent(context) { const { env } = context; try { ... } catch (error) { return { success: false, message: error.message }; } }`,
      envCheck: `if (!env.VARIABLE) return { success: false, message: "VARIABLE non définie" };`,
      fetchApi: `const response = await fetch('/api/endpoint'); const data = await response.json();`,
      googleAppsScript: `fetch(env.APPSCRIPT_URL, { method: 'POST', redirect: 'follow', body: JSON.stringify({...}) })`,
      errorHandling: `try { ... } catch (error) { return { success: false, message: error.message, timestamp: new Date().toISOString() }; }`
    }
  }
};

// Fonction helper pour obtenir le contexte selon le mode
export function getContextForMode(mode) {
  if (mode === 'agent' || mode === 'agents') {
    return IDE_CONTEXT.agentContext;
  }
  return IDE_CONTEXT.htmxContext;
}

// Fonction helper pour obtenir les patterns
export function getPatternsForMode(mode) {
  if (mode === 'agent' || mode === 'agents') {
    return IDE_CONTEXT.commonPatterns.agents;
  }
  return IDE_CONTEXT.commonPatterns.htmx;
}

