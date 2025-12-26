# Patch pour ajouter le Mode Switcher dans IDE.html

## Modifications à apporter dans `admin/ide.html`

### 1. Remplacer la section "Domain Display" (ligne ~48-66) par :

```html
<!-- Mode Switcher -->
<div class="flex-1 flex justify-center">
    <div class="bg-slate-700 rounded-lg p-1 flex gap-1">
        <button onclick="switchMode('htmx')" id="mode-htmx-btn"
            class="px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 bg-purple-600 text-white shadow-lg">
            <i class="fas fa-code"></i>
            Mode HTMX
        </button>
        <button onclick="switchMode('agent')" id="mode-agent-btn"
            class="px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-600">
            <i class="fas fa-robot"></i>
            Mode Agents
        </button>
    </div>
</div>

<div class="flex items-center gap-3" id="header-actions">
    <!-- HTMX Mode Actions -->
    <div id="htmx-actions" class="flex items-center gap-3">
        <button onclick="previewPageNewTab()"
            class="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition flex items-center gap-2">
            <i class="fas fa-external-link-alt"></i> Prévisualiser
        </button>
        <button onclick="savePage('published')"
            class="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white rounded-lg font-medium transition shadow-lg flex items-center gap-2">
            <i class="fas fa-save"></i> Sauvegarder
        </button>
        <button onclick="deployFrontend()" id="btn-deploy-frontend"
            class="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white rounded-lg font-medium transition shadow-lg flex items-center gap-2">
            <i class="fas fa-rocket"></i> Déployer
        </button>
    </div>
    <!-- Agent Mode Actions -->
    <div id="agent-actions" class="hidden flex items-center gap-3">
        <button onclick="testAgent()"
            class="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition flex items-center gap-2">
            <i class="fas fa-play"></i> Tester
        </button>
        <button onclick="saveAgent()"
            class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white rounded-lg font-medium transition shadow-lg flex items-center gap-2">
            <i class="fas fa-save"></i> Sauvegarder
        </button>
    </div>
</div>
```

### 2. Ajouter après le formulaire page-creator-form (après ligne ~136) :

```html
            <!-- Agent Mode Settings -->
            <div id="agent-settings" class="hidden p-6">
                <h2 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <i class="fas fa-robot text-emerald-400"></i>
                    Paramètres de l'Agent
                </h2>

                <form id="agent-creator-form" class="space-y-4">
                    <!-- Agent ID -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-slate-300 mb-2">
                            ID de l'Agent <span class="text-red-400">*</span>
                        </label>
                        <input type="text" id="agent-id" required placeholder="ex: mon-premier-agent"
                            class="w-full px-3 py-2 bg-[#1e1e1e] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition font-mono"
                            pattern="[a-z0-9-]+"
                            title="Utilisez uniquement des minuscules, chiffres et tirets">
                        <p class="text-xs text-slate-500 mt-1">En minuscules, sans espaces (sera le nom du fichier)</p>
                    </div>

                    <!-- Agent Description -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea id="agent-description" rows="3"
                            placeholder="Décrivez ce que fait cet agent..."
                            class="w-full px-3 py-2 bg-[#1e1e1e] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition resize-none"></textarea>
                    </div>

                    <!-- Agent Template -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-slate-300 mb-2">
                            Template
                        </label>
                        <button type="button" onclick="loadAgentTemplate()"
                            class="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                            <i class="fas fa-code"></i> Charger le template
                        </button>
                        <p class="text-xs text-slate-500 mt-2">Utilisez le template comme point de départ</p>
                    </div>

                    <div class="pt-4 border-t border-slate-700">
                        <button type="button" onclick="clearAgentForm()"
                            class="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition flex items-center justify-center gap-2">
                            <i class="fas fa-redo"></i> Réinitialiser
                        </button>
                    </div>

                    <div id="agent-save-status" class="text-sm"></div>
                </form>
            </div>
```

### 3. Modifier le titre de l'éditeur (ligne ~144) :

Remplacer :
```html
<h3 class="font-semibold text-slate-200 flex items-center gap-2">
    <i class="fas fa-code text-orange-500"></i>
    Éditeur HTML
</h3>
```

Par :
```html
<h3 class="font-semibold text-slate-200 flex items-center gap-2">
    <i id="editor-icon" class="fas fa-code text-orange-500"></i>
    <span id="editor-title">Éditeur HTML</span>
</h3>
```

### 4. Modifier la fonction initMonacoEditor pour accepter un paramètre language :

Remplacer :
```javascript
function initMonacoEditor(initialValue = '') {
```

Par :
```javascript
function initMonacoEditor(initialValue = '', language = 'html') {
```

Et changer :
```javascript
language: 'html',
```

Par :
```javascript
language: language,
```

### 5. Ajouter ces fonctions JavaScript AVANT `document.addEventListener('DOMContentLoaded')` :

```javascript
// Global mode variable
let currentMode = 'htmx'; // 'htmx' or 'agent'

// Switch between HTMX and Agent modes
function switchMode(mode) {
    if (mode === currentMode) return;
    
    currentMode = mode;
    
    // Update switcher buttons
    const htmxBtn = document.getElementById('mode-htmx-btn');
    const agentBtn = document.getElementById('mode-agent-btn');
    const htmxActions = document.getElementById('htmx-actions');
    const agentActions = document.getElementById('agent-actions');
    const htmxSettings = document.getElementById('htmx-settings');
    const agentSettings = document.getElementById('agent-settings');
    const editorIcon = document.getElementById('editor-icon');
    const editorTitle = document.getElementById('editor-title');
    
    if (mode === 'htmx') {
        htmxBtn.className = 'px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 bg-purple-600 text-white shadow-lg';
        agentBtn.className = 'px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-600';
        htmxActions.classList.remove('hidden');
        agentActions.classList.add('hidden');
        htmxSettings.classList.remove('hidden');
        agentSettings.classList.add('hidden');
        editorIcon.className = 'fas fa-code text-orange-500';
        editorTitle.textContent = 'Éditeur HTML';
        
        // Change Monaco language to HTML
        if (monacoEditor) {
            monaco.editor.setModelLanguage(monacoEditor.getModel(), 'html');
        }
    } else {
        htmxBtn.className = 'px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-600';
        agentBtn.className = 'px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 bg-emerald-600 text-white shadow-lg';
        htmxActions.classList.add('hidden');
        agentActions.classList.remove('hidden');
        htmxSettings.classList.add('hidden');
        agentSettings.classList.remove('hidden');
        editorIcon.className = 'fas fa-robot text-emerald-500';
        editorTitle.textContent = 'Éditeur JavaScript';
        
        // Change Monaco language to JavaScript
        if (monacoEditor) {
            monaco.editor.setModelLanguage(monacoEditor.getModel(), 'javascript');
        }
    }
    
    // Clear editor if switching modes
    if (monacoEditor && !confirm('Changer de mode va effacer le contenu actuel. Continuer ?')) {
        // Reset mode
        currentMode = mode === 'htmx' ? 'agent' : 'htmx';
        switchMode(currentMode);
        return;
    }
    
    if (monacoEditor && mode !== currentMode) {
        monacoEditor.setValue('');
    }
}

// Agent Functions
function loadAgentTemplate() {
    const template = `/**
 * Agent Description
 * 
 */

export default async function agent(context) {
  const { env } = context;
  
  try {
    // Votre logique ici
    // Accès exclusif aux variables d'environnement via env
    
    return {
      success: true,
      message: "Agent exécuté avec succès",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}`;
    
    if (monacoEditor) {
        monacoEditor.setValue(template);
    }
    
    // Auto-fill agent ID if empty
    const agentIdInput = document.getElementById('agent-id');
    if (agentIdInput && !agentIdInput.value) {
        agentIdInput.value = 'mon-agent-' + Date.now().toString().slice(-6);
    }
}

function clearAgentForm() {
    document.getElementById('agent-id').value = '';
    document.getElementById('agent-description').value = '';
    if (monacoEditor) {
        monacoEditor.setValue('');
    }
}

async function saveAgent() {
    const agentId = document.getElementById('agent-id')?.value.trim();
    const description = document.getElementById('agent-description')?.value.trim();
    const code = monacoEditor ? monacoEditor.getValue().trim() : '';

    if (!agentId) {
        alert('Veuillez entrer un ID pour l\'agent');
        return;
    }

    if (!code) {
        alert('Le code de l\'agent ne peut pas être vide');
        return;
    }

    // Valider le format de l'ID
    if (!/^[a-z0-9-]+$/.test(agentId)) {
        alert('L\'ID doit contenir uniquement des minuscules, chiffres et tirets');
        return;
    }

    // Valider que le code exporte bien une fonction agent
    if (!code.includes('export default') || !code.includes('function agent')) {
        if (!confirm('Le code ne semble pas exporter une fonction "agent". Voulez-vous continuer quand même ?')) {
            return;
        }
    }

    try {
        const response = await fetch('/api/agents/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Key': getAuthToken()
            },
            body: JSON.stringify({
                agentId,
                code,
                description
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Agent sauvegardé avec succès sur GitHub !\n\nID: ' + agentId);
            document.getElementById('page-status').textContent = `Agent: ${agentId}`;
        } else {
            throw new Error(result.error || 'Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('Save agent error:', error);
        alert(`Erreur: ${error.message}`);
    }
}

async function testAgent() {
    const agentId = document.getElementById('agent-id')?.value.trim();
    
    if (!agentId) {
        alert('Veuillez d\'abord sauvegarder l\'agent avec un ID');
        return;
    }

    if (!confirm(`Voulez-vous tester l'agent "${agentId}" ?\n\nAssurez-vous d'avoir sauvegardé les modifications.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/agents/${agentId}/execute`, {
            method: 'POST',
            headers: {
                'X-Auth-Key': getAuthToken()
            }
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Agent exécuté avec succès !\n\nTemps: ${result.executionTime}ms\n\nRésultat:\n${JSON.stringify(result.result, null, 2)}`);
        } else {
            throw new Error(result.error || 'Erreur lors de l\'exécution');
        }
    } catch (error) {
        console.error('Test agent error:', error);
        alert(`Erreur: ${error.message}`);
    }
}

async function loadAgent(agentId) {
    try {
        const response = await fetch(`/api/agents/load?id=${encodeURIComponent(agentId)}`, {
            headers: {
                'X-Auth-Key': getAuthToken()
            }
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('agent-id').value = agentId;
            if (monacoEditor) {
                monacoEditor.setValue(result.code);
            }
            document.getElementById('page-status').textContent = `Agent: ${agentId}`;
            switchMode('agent');
        } else {
            throw new Error(result.error || 'Erreur lors du chargement');
        }
    } catch (error) {
        console.error('Load agent error:', error);
        alert(`Erreur: ${error.message}`);
    }
}
```

### 6. Modifier `document.addEventListener('DOMContentLoaded')` :

Remplacer la section qui initialise et charge les pages par :

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    // L'authentification est gérée automatiquement par core/admin.js

    // Initialize Monaco Editor
    initMonacoEditor('', 'html');

    // Check URL parameters to determine mode
    const urlParams = new URLSearchParams(window.location.search);
    const agentParam = urlParams.get('agent');
    const newAgent = urlParams.get('new-agent');
    const pageSlug = urlParams.get('page');

    if (agentParam) {
        // Loading existing agent
        setTimeout(() => loadAgent(agentParam), 500);
    } else if (newAgent === 'true') {
        // New agent mode
        switchMode('agent');
        setTimeout(() => loadAgentTemplate(), 500);
    } else if (pageSlug) {
        // Loading existing page (HTMX mode)
        setTimeout(() => loadPageBySlug(pageSlug), 500);
    }
});
```

### 7. Envelopper le panneau de settings HTMX :

Remplacer :
```html
<!-- Left Panel - Page Settings -->
<div class="w-80 bg-[#252526] border-r border-slate-700 overflow-y-auto flex-shrink-0">
    <div class="p-6">
```

Par :
```html
<!-- Left Panel - Settings -->
<div class="w-80 bg-[#252526] border-r border-slate-700 overflow-y-auto flex-shrink-0">
    <!-- HTMX Mode Settings -->
    <div id="htmx-settings" class="p-6">
```

## Fichiers API créés

✅ `/functions/api/agents/save.js` - Endpoint pour sauvegarder un agent
✅ `/functions/api/agents/load.js` - Endpoint pour charger un agent
✅ Routing ajouté dans `server.js`

## Résumé

Une fois ces modifications appliquées, l'IDE aura :
- ✅ Un switcher pour basculer entre Mode HTMX et Mode Agents
- ✅ Interface adaptée selon le mode
- ✅ Monaco Editor en HTML ou JavaScript selon le mode
- ✅ Sauvegarde/chargement des agents depuis GitHub
- ✅ Test d'exécution des agents depuis l'IDE
