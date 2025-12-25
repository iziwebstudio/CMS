// Fonction pour convertir markdown en HTML côté serveur
// Utilisée par le middleware pour servir la documentation

/**
 * Convertit du markdown en HTML (conversion simple côté serveur)
 * Pour une conversion plus complète, on pourrait utiliser une bibliothèque comme markdown-it
 */
export function markdownToHtml(markdown) {
    if (!markdown) return '';
    
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
    
    // Lists
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Paragraphs (simple: chaque ligne qui n'est pas déjà un tag HTML)
    html = html.split('\n').map(line => {
        line = line.trim();
        if (!line) return '';
        if (line.startsWith('<')) return line;
        return `<p>${line}</p>`;
    }).join('\n');
    
    // Blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
    
    return html;
}

/**
 * Charge un fichier markdown et le convertit en HTML
 */
export async function loadDocAsHtml(env, path, requestUrl = null) {
    try {
        // Construire le chemin du fichier markdown
        // path = /docs/guide/quick-start -> docs/guide/quick-start.md
        let filePath = path.replace(/^\/docs\//, 'docs/');
        if (!filePath.endsWith('.md')) {
            filePath = `${filePath}.md`;
        }
        
        // Lire le fichier depuis les assets
        const baseUrl = requestUrl || 'https://example.com';
        const mdUrl = new URL(`/${filePath}`, baseUrl);
        const mdRequest = new Request(mdUrl.toString());
        const mdResponse = await env.ASSETS.fetch(mdRequest);
        
        if (!mdResponse.ok) {
            return null;
        }
        
        const markdown = await mdResponse.text();
        
        // Convertir en HTML
        const html = markdownToHtml(markdown);
        
        // Wrapper dans une div avec la classe markdown-content
        return generateDocPage(html);
    } catch (error) {
        console.error('Error loading doc:', error);
        return null;
    }
}

/**
 * Génère le HTML complet pour une page de documentation
 */
export function generateDocPage(htmlContent, title = 'Documentation') {
    return `
        <div class="markdown-content">
            ${htmlContent || '<p>Documentation non trouvée</p>'}
        </div>
    `;
}

