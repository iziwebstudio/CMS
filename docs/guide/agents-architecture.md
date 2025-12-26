# 🤖 Architecture des Agents

> Guide complet sur le système d'agents automatisés de WebSuite CMS

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture à 3 composants](#architecture-à-3-composants)
3. [Format des agents](#format-des-agents)
4. [Endpoints API](#endpoints-api)
5. [Sécurité](#sécurité)
6. [Logs et monitoring](#logs-et-monitoring)
7. [Configuration](#configuration)
8. [Exemples](#exemples)

---

## Vue d'ensemble

Les agents sont des **fonctions JavaScript** automatisées qui s'exécutent selon un planning (CronJob) ou manuellement depuis l'interface admin.

### Fonctionnalités

- ✅ **Stockage sur GitHub** : Les agents sont versionnés dans `functions/agents/`
- ✅ **Exécution automatique** : Via CronJob.org avec token de sécurité
- ✅ **Exécution manuelle** : Depuis l'interface admin
- ✅ **Logs automatiques** : Stockés dans `functions/agents/logs/`
- ✅ **Variables d'environnement** : Accès exclusif aux `env` variables

---

## Architecture à 3 composants

```
┌─────────────────────────────────────────────────────────────┐
│                      1. IDE                                  │
│            (admin/ide.html)                                  │
│  • Entrer le prompt de l'agent                              │
│  • Générer le script avec l'IA                              │
│  • Prévisualiser et tester                                  │
│  • Sauvegarder sur GitHub                                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Sauvegarde via API GitHub
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   2. GitHub                                  │
│          (functions/agents/[nom].js)                         │
│  • Stockage du script de l'agent                            │
│  • Versioning automatique                                   │
│  • Accessible via /api/agents                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ CronJob appelle l'endpoint
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              3. API CronJob (Worker)                         │
│         (/api/agents/[id]/execute)                           │
│  • CronJob.org appelle l'endpoint                           │
│  • Le worker charge l'agent depuis GitHub                   │
│  • Exécute le script avec les variables d'env               │
│  • Sauvegarde les logs sur GitHub                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Format des agents

### Structure standard

Chaque agent est un fichier `.js` qui exporte une fonction par défaut :

```javascript
// functions/agents/example-agent.js
/**
 * Agent Example
 * Description: Ceci est un exemple d'agent
 * Schedule: 0 9 * * * (tous les jours à 9h)
 */

export default async function agent(context) {
  const { env } = context;
  
  try {
    // Votre logique ici
    // Accès exclusif aux variables d'environnement via env
    const result = await performTask(env);
    
    return {
      success: true,
      data: result,
      message: "Tâche effectuée avec succès",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
```

### Contraintes

1. **Export obligatoire** : `export default async function agent(context)`
2. **Paramètre context** : Contient uniquement `{ env }` (variables d'environnement)
3. **Retour** : Doit retourner un objet avec `success` (booléen)

---

## Endpoints API

### 1. Liste des agents

**GET** `/api/agents`

Retourne la liste de tous les agents disponibles.

**Auth** : Admin uniquement

**Réponse** :
```json
[
  {
    "id": "example-agent",
    "name": "Example Agent",
    "status": "active",
    "path": "functions/agents/example-agent.js",
    "sha": "...",
    "download_url": "..."
  }
]
```

### 2. Informations d'un agent

**GET** `/api/agents/[id]`

Retourne les informations détaillées d'un agent.

**Auth** : Admin uniquement

**Réponse** :
```json
{
  "id": "example-agent",
  "name": "Example Agent",
  "path": "functions/agents/example-agent.js",
  "sha": "...",
  "size": 1234,
  "lastModified": "..."
}
```

### 3. Exécuter un agent

**POST/GET** `/api/agents/[id]/execute`

Exécute un agent et retourne le résultat.

**Auth** : Admin OU Token CronJob

**Headers optionnels** :
- `X-Cron-Token: [CRONJOB_API_KEY]` (pour CronJob)

**Query params optionnels** :
- `?token=[CRONJOB_API_KEY]` (alternative au header)

**Réponse** :
```json
{
  "success": true,
  "agentId": "example-agent",
  "executionTime": 1234,
  "result": {
    "success": true,
    "data": "...",
    "message": "Tâche effectuée avec succès"
  },
  "logged": true
}
```

### 4. Lire les logs

**GET** `/api/agents/[id]/logs`

Retourne l'historique des exécutions d'un agent.

**Auth** : Admin uniquement

**Réponse** :
```json
{
  "agentId": "example-agent",
  "logs": [
    {
      "timestamp": "2024-01-01T10:00:00.000Z",
      "data": {
        "agentId": "example-agent",
        "success": true,
        "executionTime": 1234,
        "result": {...},
        "triggeredBy": "cronjob"
      }
    }
  ],
  "count": 100
}
```

---

## Sécurité

### Double authentification

L'endpoint `/api/agents/[id]/execute` accepte **deux méthodes d'authentification** :

1. **Authentification admin** : Via header `X-Auth-Key` (même que l'admin)
2. **Token CronJob** : Via header `X-Cron-Token` ou query param `?token=...`

### Configuration du token CronJob

Dans `.dev.vars` (local) ou Variables d'environnement Cloudflare (production) :

```bash
CRONJOB_API_KEY=votre_token_secret_ici
```

**Recommandation** : Générer un token aléatoire sécurisé :
```bash
openssl rand -hex 32
```

### Configuration CronJob.org

1. Créer un nouveau cron job sur [CronJob.org](https://console.cron-job.org)
2. URL : `https://votre-domaine.com/api/agents/[AGENT_ID]/execute?token=[CRONJOB_API_KEY]`
3. Méthode : GET ou POST
4. Schedule : Expression Cron (ex: `0 9 * * *` pour tous les jours à 9h)

---

## Logs et monitoring

### Stockage des logs

Les logs sont automatiquement sauvegardés dans :
- **Chemin** : `functions/agents/logs/[agent-id].log`
- **Format** : Une ligne par exécution (JSON)
- **Rotation** : Limite à 1000 dernières lignes automatiquement

### Format de log

Chaque ligne de log suit ce format :
```
[2024-01-01T10:00:00.000Z] {"agentId":"example-agent","success":true,"executionTime":1234,"result":{...},"triggeredBy":"cronjob","timestamp":"2024-01-01T10:00:00.000Z"}
```

### Contenu des logs

Chaque entrée de log contient :
- `agentId` : ID de l'agent
- `success` : Succès ou échec de l'exécution
- `executionTime` : Temps d'exécution en ms
- `result` : Résultat retourné par l'agent
- `triggeredBy` : `'cronjob'` ou `'admin'`
- `timestamp` : Date/heure ISO

---

## Configuration

### Variables d'environnement requises

#### Local (.dev.vars)

```bash
# GitHub (pour stocker/charger les agents)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_USER=votre-username
GITHUB_REPO=votre-repo

# CronJob (pour sécuriser l'exécution)
CRONJOB_API_KEY=votre_token_secret_ici

# Auth admin
ADMIN_PASSWORD=votre_mot_de_passe
```

#### Production (Cloudflare)

Configurer via Cloudflare Dashboard → Workers & Pages → Variables d'environnement.

---

## Exemples

### Exemple 1 : Agent simple

```javascript
// functions/agents/simple-test.js
export default async function agent(context) {
  const { env } = context;
  
  console.log('Agent simple exécuté !');
  
  return {
    success: true,
    message: 'Agent exécuté avec succès',
    timestamp: new Date().toISOString()
  };
}
```

### Exemple 2 : Agent avec appel API

```javascript
// functions/agents/fetch-data.js
export default async function agent(context) {
  const { env } = context;
  
  try {
    // Utiliser une variable d'environnement
    const apiUrl = env.MY_API_URL;
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    return {
      success: true,
      data: data,
      message: `Données récupérées : ${data.length} éléments`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
```

### Exemple 3 : Agent avec traitement de données

```javascript
// functions/agents/process-rss.js
export default async function agent(context) {
  const { env } = context;
  
  try {
    // Lire un flux RSS
    const rssUrl = env.BLOG_RSS_URL;
    const response = await fetch(rssUrl);
    const xml = await response.text();
    
    // Parser et traiter
    // ... logique de traitement ...
    
    return {
      success: true,
      processed: 10,
      message: 'Flux RSS traité avec succès',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
```

---

## Flux d'exécution complet

### Exécution via CronJob

```
1. CronJob.org appelle l'endpoint
   ↓
2. /api/agents/[id]/execute
   ↓
3. Vérification token CronJob (X-Cron-Token ou ?token=...)
   ↓
4. Chargement de l'agent depuis GitHub
   ↓
5. Exécution de l'agent avec context.env
   ↓
6. Sauvegarde du log sur GitHub (async)
   ↓
7. Retour du résultat JSON
```

### Exécution manuelle (Admin)

```
1. Interface admin → Bouton "Exécuter"
   ↓
2. Appel API avec header X-Auth-Key
   ↓
3. /api/agents/[id]/execute
   ↓
4. Vérification auth admin
   ↓
5. Chargement et exécution (identique)
   ↓
6. Sauvegarde du log
   ↓
7. Affichage du résultat dans l'UI
```

---

## Résumé

| Aspect | Détails |
|--------|---------|
| **Stockage** | GitHub (`functions/agents/[id].js`) |
| **Exécution** | Worker Cloudflare ou Bun local |
| **Sécurité** | Auth admin OU Token CronJob |
| **Logs** | GitHub (`functions/agents/logs/[id].log`) |
| **Variables** | Accès exclusif via `context.env` |
| **Format** | `export default async function agent(context)` |

---

## Liens utiles

- [Architecture du Serveur](./server-architecture.md)
- [Configuration GitHub](../../configuration/overview.md)
- [API Overview](../../api/overview.md)
- [CronJob.org Documentation](https://docs.cron-job.org/)

---

<p align="center">
  <strong>Questions ?</strong> Consultez la [FAQ](../../faq/troubleshooting.md) ou ouvrez une [issue](https://github.com/iziweb-studio/CMS/issues)
</p>
