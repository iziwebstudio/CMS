# Mode Offline - Installation des Assets

Pour que Tailwind CSS et Font Awesome fonctionnent en mode offline, vous devez télécharger les assets.

## Installation automatique

Exécutez le script de téléchargement :

```bash
./download-assets.sh
```

Ce script va :
1. Créer les dossiers nécessaires (`static/js`, `static/css`, `static/webfonts`)
2. Télécharger Tailwind CSS Play CDN
3. Télécharger Font Awesome CSS et les webfonts
4. Corriger les chemins dans le CSS pour pointer vers les fichiers locaux

## Installation manuelle

Si le script ne fonctionne pas, vous pouvez télécharger manuellement :

### 1. Tailwind CSS
```bash
curl -L https://cdn.tailwindcss.com -o static/js/tailwindcss.js
```

### 2. HTMX
```bash
curl -L https://unpkg.com/htmx.org@1.9.10/dist/htmx.min.js -o static/js/htmx.min.js
```

### 3. Font Awesome CSS
```bash
curl -L https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css -o static/css/all.min.css
```

Ensuite, modifiez `static/css/all.min.css` pour remplacer tous les chemins `../webfonts/` par `/static/webfonts/`.

### 4. Font Awesome Webfonts
```bash
cd static/webfonts
curl -L https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2 -o fa-brands-400.woff2
curl -L https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2 -o fa-regular-400.woff2
curl -L https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2 -o fa-solid-900.woff2
```

## Structure finale

Après l'installation, vous devriez avoir :

```
ProdBeta/
├── static/
│   ├── js/
│   │   ├── tailwindcss.js
│   │   └── htmx.min.js
│   ├── css/
│   │   └── all.min.css
│   └── webfonts/
│       ├── fa-brands-400.woff2
│       ├── fa-regular-400.woff2
│       └── fa-solid-900.woff2
└── ...
```

## Vérification

Une fois les assets téléchargés, redémarrez le serveur :

```bash
bun server.js
```

Les fichiers HTML pointent maintenant vers `/static/js/tailwindcss.js` et `/static/css/all.min.css` au lieu des CDN externes.

