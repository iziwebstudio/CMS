# 🏗️ Architecture du Serveur Local (server.js)

> Guide complet sur le fonctionnement du serveur local Bun qui remplace le middleware Cloudflare en développement

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture générale](#architecture-générale)
3. [Système de routage](#système-de-routage)
4. [Gestion des routes API](#gestion-des-routes-api)
5. [Gestion HTMX et SSR](#gestion-htmx-et-ssr)
6. [Simulateurs Cloudflare](#simulateurs-cloudflare)
7. [Flux d'exécution](#flux-dexécution)
8. [Configuration](#configuration)
9. [Développement local](#développement-local)

---

## Vue d'ensemble

Le fichier `server.js` est un **middleware local** qui simule l'environnement Cloudflare Workers pour le développement. Il permet de :

- ✅ Tester localement sans déploiement
- ✅ Utiliser les mêmes fonctions API qu'en production
- ✅ Gérer le routage, HTMX et le SSR
- ✅ Simuler le cache et les variables d'environnement Cloudflare

### Comparaison Middleware Cloudflare vs server.js

| Fonctionnalité | Middleware Cloudflare | server.js (Bun) |
|----------------|----------------------|-----------------|
| **Runtime** | Cloudflare Workers | Bun Runtime |
| **Déploiement** | Edge global | Local (port 8000) |
| **Cache** | `caches.default` | Cache mémoire (180s) |
| **Variables** | Cloudflare Dashboard | `.dev.vars` |
| **Assets** | `env.ASSETS.fetch()` | `mockAssets.fetch()` |
| **Fonctions API** | ✅ Identiques | ✅ Identiques |

---

## Architecture générale

```
┌─────────────────────────────────────────────────────────────┐
│                      SERVER.JS                              │
│                  (Middleware Principal)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Requête HTTP
                            ▼
        ┌───────────────────────────────────────┐
        │      Détection de la Route            │
        └───────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  /api/*      │   │  /admin/*    │   │  SSR + HTMX  │
│  Routes API  │   │  Admin UI    │   │  Frontend    │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ functions/   │   │ admin/*.html │   │ frontend/    │
│ api/*.js     │   │ (statique)   │   │ index.html   │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## Système de routage

Le routage est géré dans l'ordre de priorité suivant (lignes 236-429) :

### 1. Routes API (`/api/*`) - Priorité 1

```javascript
if (pathname.startsWith('/api/')) {
  return await handleApiRoute(pathname, req);
}
```

**Rôle** : Gère toutes les requêtes vers l'API  
**Handler** : `handleApiRoute()` (lignes 154-231)

### 2. Routes Admin (`/admin/*`, `/core/*`) - Priorité 2

```javascript
if (pathname === '/admin' || pathname.startsWith('/admin/')) {
  if (pathname === '/admin') {
    pathname = '/admin/';  // Normalisation
  }
  return await serveFileOrIndex(pathname);
}
```

**Rôle** : Sert les fichiers statiques de l'interface admin  
**Fichiers** : `admin/*.html`  
**Gestion** : Normalise `/admin` → `/admin/` puis cherche `admin/index.html`

### 3. Assets statiques (CSS, JS, images) - Priorité 3

```javascript
if (pathname.includes('.') && !pathname.endsWith('.html')) {
  return await serveFile(pathname);
}
```

**Rôle** : Sert les fichiers statiques (CSS, JS, fonts, images)  
**Exclusion** : Les fichiers HTML sont gérés par le SSR

### 4. SSR avec HTMX - Priorité 4 (catch-all)

```javascript
// Charge frontend/index.html
const template = await loadFile('frontend/index.html');

// Détecte HTMX
const isHtmx = isHtmxRequest(req);

// Génère le contenu dynamiquement
return handleHtmxCatchAll(...);
```

**Rôle** : Rendu côté serveur pour toutes les autres routes  
**Template** : `frontend/index.html`  
**Détection** : HTMX vs requête normale

---

## Gestion des routes API

### Fonction `handleApiRoute()`

Cette fonction (lignes 154-231) gère toutes les routes API :

#### Routes simples

```javascript
const simpleRoutes = {
  'posts': './functions/api/posts.js',
  'videos': './functions/api/videos.js',
  'podcasts': './functions/api/podcasts.js',
  'events': './functions/api/events.js',
  'siteinfos': './functions/api/siteinfos.js',
  'config': './functions/api/config.js',
};
```

**Exemples** :
- `GET /api/posts` → `functions/api/posts.js` → `onRequestGet()`
- `GET /api/videos` → `functions/api/videos.js` → `onRequestGet()`

#### Routes avec paramètres

Utilise des expressions régulières pour extraire les paramètres :

```javascript
// Post par slug
/api/post/:slug → /^post\/(.+)$/
// Exemple: /api/post/mon-article → params: { slug: 'mon-article' }

// Vidéo par ID
/api/video/:id → /^video\/(.+)$/
// Exemple: /api/video/abc123 → params: { id: 'abc123' }

// Podcast par ID
/api/podcast/:id → /^podcast\/(.+)$/

// Événement par slug
/api/event/:slug → /^event\/(.+)$/
```

**Exemple de code** :
```javascript
const slugMatch = apiPath.match(/^post\/(.+)$/);
if (slugMatch) {
  const handler = await import('./functions/api/post/[slug].js');
  const context = { request, env, params: { slug: slugMatch[1] } };
  return await handler.onRequestGet?.(context);
}
```

#### Routes POST spéciales

```javascript
// Authentification
POST /api/login   → functions/api/login.js
POST /api/logout  → functions/api/logout.js

// Cache
POST /api/clear-cache → functions/api/clear-cache.js
```

### Contexte passé aux fonctions API

Toutes les fonctions API reçoivent le même contexte qu'en production :

```javascript
const context = {
  request: Request,    // Objet Request HTTP
  env: {              // Variables d'environnement
    // Variables chargées depuis .dev.vars
    ADMIN_PASSWORD: "...",
    BLOG_RSS_URL: "...",
    // ... etc
    ASSETS: mockAssets,  // Simulateur d'ASSETS
  }
};
```

**Compatibilité** : Les fonctions API fonctionnent **sans modification** car elles reçoivent exactement le même format qu'en production Cloudflare.

---

## Gestion HTMX et SSR

### Détection HTMX

```javascript
// Ligne 340
const isHtmx = isHtmxRequest(req);
```

**Fonction** : Vérifie le header `HX-Request: true`  
**Utilisation** : Détermine le format de la réponse (fragment HTML vs page complète)

### Fonctions HTMX (depuis `htmx-render.js`)

Les fonctions suivantes sont importées et utilisées :

| Fonction | Rôle |
|----------|------|
| `isHtmxRequest()` | Détecte les requêtes HTMX |
| `htmlResponse()` | Formate une réponse HTML |
| `generateOOB()` | Génère les Out-of-Band swaps (titre, meta) |
| `injectContent()` | Injecte le contenu dans le template |
| `handleHtmxCatchAll()` | Gère automatiquement les routes HTMX |
| `detectAndRenderContentRoute()` | Détecte et rend les routes de contenu |

### Route racine (`/`)

```javascript
if (path === '/' || path === '/index.html') {
  const metadata = {
    title: siteName,
    description: siteDescription,
    keywords: siteKeywords,
    siteName: siteName
  };
  const content = generateHomeContent(template, metadata);
  
  if (isHtmx) {
    return htmlResponse(content + generateOOB(metadata, req));
  }
  return htmlResponse(injectContent(template, content, metadata));
}
```

**Comportement** :
- Charge le template `tpl-home` depuis `frontend/index.html`
- Génère le contenu avec `generateHomeContent()`
- HTMX : Retourne un fragment + OOB
- Non-HTMX : Injecte dans le template complet

### Routes de contenu (`/posts`, `/post/:slug`, etc.)

```javascript
// Ligne 360
const htmxCatchAll = await handleHtmxCatchAll(
  req, path, template, siteConfig, null, env
);
```

**Fonctionnement** :
1. Détecte automatiquement le type de route
2. Appelle l'API correspondante (ex: `/api/posts`)
3. Génère le HTML depuis les templates
4. Gère les Out-of-Band swaps (mise à jour titre/méta)

**Exemple** : Requête vers `/posts`
```
Requête → handleHtmxCatchAll()
  → Détecte route "posts"
  → Appelle /api/posts
  → Charge functions/api/posts.js
  → Retourne JSON des posts
  → Génère HTML depuis tpl-posts
  → Retourne fragment HTML (HTMX) ou page complète
```

### Routes avec templates personnalisés

Si aucune route de contenu n'est détectée, le système cherche un template :

```javascript
// Exemple: /ma-page → cherche template "tpl-ma-page"
const tplId = `tpl-${slug}`;
const tplContent = extractTemplate(template, tplId);

if (tplContent) {
  // Injecte le template dans la page
  return htmlResponse(injectContent(template, tplContent, metadata));
} else {
  // 404 - Template non trouvé
  return new Response(/* 404 page */, { status: 404 });
}
```

---

## Simulateurs Cloudflare

### 1. Cache en mémoire

```javascript
// Lignes 19-41
const memoryCache = new Map();
const CACHE_TTL = 180000; // 180 secondes

global.caches = {
  default: {
    match: async (request) => {
      const key = typeof request === 'string' ? request : request.url;
      const cached = memoryCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.response.clone();
      }
      return undefined;
    },
    put: async (request, response) => {
      const key = typeof request === 'string' ? request : request.url;
      memoryCache.set(key, {
        response: response.clone(),
        timestamp: Date.now()
      });
    }
  }
};
```

**Rôle** : Simule `caches.default` de Cloudflare  
**TTL** : 180 secondes  
**Utilisation** : Les fonctions API peuvent utiliser `await caches.default.match(request)` comme en production

### 2. Variables d'environnement

```javascript
// Lignes 43-76
function loadEnvVars() {
  const envVars = {};
  
  // Charger depuis .dev.vars
  const devVarsPath = join(projectRoot, '.dev.vars');
  if (existsSync(devVarsPath)) {
    const content = readFileSync(devVarsPath, 'utf-8');
    // Parse les variables ligne par ligne
    // Format: KEY=VALUE
  }
  
  // Ajouter les variables système (prioritaires)
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('ADMIN_') || key.startsWith('BLOG_') || ...) {
      envVars[key] = process.env[key];
    }
  });
  
  return envVars;
}
```

**Fichier** : `.dev.vars`  
**Format** :
```bash
ADMIN_PASSWORD=monmotdepasse
BLOG_RSS_URL=https://example.com/feed
YOUTUBE_RSS_URL=https://youtube.com/feed
```

### 3. Mock ASSETS

```javascript
// Lignes 138-151
const mockAssets = {
  fetch: async (request) => {
    const url = typeof request === 'string' 
      ? new URL(request, 'http://localhost:8000') 
      : new URL(request.url);
    const filePath = url.pathname;
    
    const response = await serveFileOrIndex(filePath);
    if (response) return response;
    
    return new Response('File not found', { status: 404 });
  }
};

env.ASSETS = mockAssets;
```

**Rôle** : Simule `env.ASSETS.fetch()` de Cloudflare  
**Utilisation** : Permet aux fonctions API d'accéder aux fichiers statiques

---

## Flux d'exécution

### Exemple complet : Accès à `/posts`

```
1. Requête HTTP GET /posts
   │
   ▼
2. server.js ligne 236 : async fetch(req)
   │
   ▼
3. Parse URL → pathname = "/posts"
   │
   ▼
4. Vérification CORS (OPTIONS) → Skip
   │
   ▼
5. Route API ? /api/* → Non
   │
   ▼
6. Route Admin ? /admin/* → Non
   │
   ▼
7. Asset statique ? (contient ".") → Non
   │
   ▼
8. SSR + HTMX (ligne 283)
   │
   ├─► Charge frontend/index.html
   │
   ├─► Détecte HTMX ? isHtmxRequest(req)
   │   └─► Header "HX-Request" === "true" ?
   │
   ├─► handleHtmxCatchAll() (ligne 360)
   │   │
   │   ├─► Détecte route "posts"
   │   │
   │   ├─► Appelle /api/posts
   │   │   │
   │   │   └─► handleApiRoute("/api/posts")
   │   │       │
   │   │       ├─► Charge functions/api/posts.js
   │   │       │
   │   │       ├─► Appelle onRequestGet({ request, env })
   │   │       │
   │   │       ├─► La fonction utilise caches.default.match()
   │   │       │   └─► Cache simulé → retourne undefined
   │   │       │
   │   │       ├─► Fait fetch() vers RSS URL
   │   │       │
   │   │       ├─► Parse RSS → JSON
   │   │       │
   │   │       ├─► Cache la réponse : caches.default.put()
   │   │       │   └─► Cache mémoire local
   │   │       │
   │   │       └─► Retourne JSON des posts
   │   │
   │   ├─► Reçoit JSON des posts
   │   │
   │   ├─► Génère HTML depuis template "tpl-posts"
   │   │   └─► Utilise generatePublicationsContent()
   │   │
   │   ├─► Génère Out-of-Band swaps
   │   │   └─► Mise à jour <title>, <meta>
   │   │
   │   └─► Retourne HTML (fragment si HTMX, complet sinon)
   │
   └─► Response HTTP avec HTML
```

### Diagramme de flux simplifié

```
┌─────────────┐
│  Requête    │
│  HTTP       │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Routage     │
│ (4 étapes)  │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌─────┐ ┌─────────┐
│ API │ │ SSR/HTMX│
└──┬──┘ └────┬────┘
   │         │
   │         ▼
   │    ┌──────────┐
   │    │ Template │
   │    │ HTML     │
   │    └──────────┘
   │
   └──────────┐
              ▼
         ┌─────────┐
         │Response │
         │ HTTP    │
         └─────────┘
```

---

## Configuration

### Configuration du site (`config.json`)

Le serveur charge automatiquement `config.json` :

```json
{
  "siteName": "WebSuite",
  "author": "Votre Nom",
  "blogRssUrl": "https://example.com/feed",
  "seo": {
    "metaTitle": "Titre SEO",
    "metaDescription": "Description SEO",
    "metaKeywords": "mots, clés, seo"
  }
}
```

**Utilisation** :
- Métadonnées pour les templates
- Valeurs par défaut pour les pages
- Configuration globale du site

### Variables d'environnement (`.dev.vars`)

Créez un fichier `.dev.vars` à la racine :

```bash
# Authentification
ADMIN_PASSWORD=votremotdepasse

# Flux RSS
BLOG_RSS_URL=https://example.com/feed
YOUTUBE_RSS_URL=https://youtube.com/feed
PODCAST_RSS_URL=https://podcast.com/feed
EVENTS_RSS_URL=https://meetup.com/events/rss

# GitHub (optionnel)
GITHUB_TOKEN=votretoken
GITHUB_USERNAME=votreusername
GITHUB_REPO=votrerepo
```

**Sécurité** : Ajoutez `.dev.vars` à `.gitignore` !

---

## Développement local

### Démarrage du serveur

```bash
# Naviguer dans le projet
cd ~/Documents/GitHub/StackPagesCMS/ProdBeta

# Démarrer le serveur
bun server.js
```

**Résultat attendu** :
```
🚀 Server running at http://localhost:8000
📁 Serving files from: /path/to/ProdBeta
🔧 Environment variables loaded: X vars
```

### URLs de test

| URL | Description |
|-----|-------------|
| `http://localhost:8000/` | Page d'accueil (SSR) |
| `http://localhost:8000/posts` | Liste des articles (HTMX) |
| `http://localhost:8000/admin` | Interface admin |
| `http://localhost:8000/api/posts` | API JSON des articles |
| `http://localhost:8000/admin/dashboard` | Dashboard admin |

### Debugging

**Logs dans la console** :
- Erreurs de chargement de fichiers
- Erreurs API
- Erreurs de templates (404)

**Vérification des routes** :
```javascript
// Ajoutez des console.log() dans server.js
console.log(`[ROUTE] ${pathname} - HTMX: ${isHtmx}`);
```

### Hot Reload

Le serveur Bun recharge automatiquement lors des changements de fichiers.  
Pour forcer un redémarrage : `Ctrl + C` puis relancer.

---

## Points importants

### ✅ Compatibilité complète

Les fonctions API fonctionnent **sans modification** car elles reçoivent :
- Le même format de `context`
- Le même `env` (simulé)
- Le même `caches.default` (simulé)
- Le même `env.ASSETS` (simulé)

### ⚠️ Différences avec la production

| Aspect | Local (Bun) | Production (Cloudflare) |
|--------|-------------|------------------------|
| **Cache** | Mémoire (perdu au redémarrage) | Edge cache distribué |
| **Performance** | Dépend de votre machine | Edge global ultra-rapide |
| **Limites** | Limites système | Limites Cloudflare Workers |

### 🔧 Personnalisation

Pour ajouter une nouvelle route :

1. **Route API simple** : Ajoutez dans `simpleRoutes` (ligne 159)
2. **Route avec paramètres** : Ajoutez un match regex (lignes 194-220)
3. **Route POST** : Ajoutez un handler (lignes 180-191)

---

## Résumé

Le `server.js` est un **middleware local complet** qui :

1. ✅ **Remplace** le middleware Cloudflare en local
2. ✅ **Gère** le routage (API, Admin, SSR)
3. ✅ **Simule** les fonctionnalités Cloudflare (cache, env, ASSETS)
4. ✅ **Détecte** et gère HTMX automatiquement
5. ✅ **Génère** le SSR pour toutes les routes

**Résultat** : Vous pouvez développer et tester **exactement comme en production**, sans déploiement !

---

## Liens utiles

- [Guide de développement local](../guide/development.md)
- [Documentation HTMX & SSR](../advanced/htmx-ssr.md)
- [Structure du projet](../guide/structure.md)
- [API Overview](../api/overview.md)

---

<p align="center">
  <strong>Questions ?</strong> Consultez la [FAQ](../faq/troubleshooting.md) ou ouvrez une [issue](https://github.com/iziweb-studio/CMS/issues)
</p>
