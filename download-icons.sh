#!/bin/zsh
# Script pour télécharger uniquement les icônes SVG des services
# Compatible avec zsh et bash

echo "📦 Téléchargement des icônes SVG des services..."
mkdir -p static/icons
cd static/icons

# Liste complète de toutes les icônes utilisées dans core/admin.js
# Format: filename|url (une par ligne pour compatibilité zsh/bash)
icons_data=(
    "github-icon-2.svg|https://cdn.worldvectorlogo.com/logos/github-icon-2.svg"
    "gemini-icon-logo.svg|https://cdn.worldvectorlogo.com/logos/gemini-icon-logo.svg"
    "youtube-icon-8.svg|https://cdn.worldvectorlogo.com/logos/youtube-icon-8.svg"
    "googleappsscript.svg|https://cdn.simpleicons.org/googleappsscript"
    "official-gmail-icon-2020-.svg|https://cdn.worldvectorlogo.com/logos/official-gmail-icon-2020-.svg"
    "google-drive-icon-2020.svg|https://cdn.worldvectorlogo.com/logos/google-drive-icon-2020.svg"
    "google-docs-icon-2.svg|https://cdn.worldvectorlogo.com/logos/google-docs-icon-2.svg"
    "google-sheets-logo-icon.svg|https://cdn.worldvectorlogo.com/logos/google-sheets-logo-icon.svg"
    "google-calendar-icon-2020-.svg|https://cdn.worldvectorlogo.com/logos/google-calendar-icon-2020-.svg"
    "google-meet-icon-2020-.svg|https://cdn.worldvectorlogo.com/logos/google-meet-icon-2020-.svg"
    "google-forms.svg|https://cdn.worldvectorlogo.com/logos/google-forms.svg"
    "microsoft-copilot-1.svg|https://cdn.worldvectorlogo.com/logos/microsoft-copilot-1.svg"
    "deepseek-2.svg|https://cdn.worldvectorlogo.com/logos/deepseek-2.svg"
    "wordpress-icon-1.svg|https://cdn.worldvectorlogo.com/logos/wordpress-icon-1.svg"
    "spotify-2.svg|https://cdn.worldvectorlogo.com/logos/spotify-2.svg"
    "streamyard.svg|https://static.wikia.nocookie.net/logopedia/images/c/ca/StreamYard_2021_%28Icon%29.svg"
    "facebook-2020-1-1.svg|https://cdn.worldvectorlogo.com/logos/facebook-2020-1-1.svg"
    "twitter-6.svg|https://cdn.worldvectorlogo.com/logos/twitter-6.svg"
    "instagram-2016-5.svg|https://cdn.worldvectorlogo.com/logos/instagram-2016-5.svg"
    "linkedin-icon-3.svg|https://cdn.worldvectorlogo.com/logos/linkedin-icon-3.svg"
    "tiktok-icon-2.svg|https://cdn.worldvectorlogo.com/logos/tiktok-icon-2.svg"
    "meta-3.svg|https://cdn.worldvectorlogo.com/logos/meta-3.svg"
    "stripe-4.svg|https://cdn.worldvectorlogo.com/logos/stripe-4.svg"
    "paypal-4.svg|https://cdn.worldvectorlogo.com/logos/paypal-4.svg"
    "shopify.svg|https://cdn.worldvectorlogo.com/logos/shopify.svg"
    "google-ads-2.svg|https://cdn.worldvectorlogo.com/logos/google-ads-2.svg"
    "supabase-icon.svg|https://www.vectorlogo.zone/logos/supabase/supabase-icon.svg"
    "gitlab.svg|https://cdn.worldvectorlogo.com/logos/gitlab.svg"
    "google-analytics-4.svg|https://cdn.worldvectorlogo.com/logos/google-analytics-4.svg"
    "airtable.svg|https://companieslogo.com/img/orig/airtable-5e5cc25f.svg"
    "trello.svg|https://cdn.worldvectorlogo.com/logos/trello.svg"
    "canva-wordmark-2.svg|https://cdn.worldvectorlogo.com/logos/canva-wordmark-2.svg"
    "slack-new-logo.svg|https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg"
)

downloaded=0
failed=0
total=${#icons_data[@]}

for icon_entry in "${icons_data[@]}"; do
    filename="${icon_entry%%|*}"
    url="${icon_entry#*|}"
    
    # Vérifier si le fichier existe déjà
    if [ -f "$filename" ]; then
        echo "  ✓ $filename (déjà présent)"
        ((downloaded++))
        continue
    fi
    
    echo -n "  - Téléchargement de $filename... "
    
    # Essayer plusieurs méthodes de téléchargement
    if command -v curl &> /dev/null; then
        # Essayer avec curl (méthode 1: normal)
        curl -L --fail --silent --max-time 10 "$url" -o "$filename" 2>/dev/null && {
            echo "✅"
            ((downloaded++))
            continue
        }
        
        # Méthode 2: avec --insecure si SSL pose problème
        curl -L --insecure --fail --silent --max-time 10 "$url" -o "$filename" 2>/dev/null && {
            echo "✅"
            ((downloaded++))
            continue
        }
        
        # Méthode 3: avec wget si disponible
        if command -v wget &> /dev/null; then
            wget --quiet --timeout=10 -O "$filename" "$url" 2>/dev/null && {
                echo "✅"
                ((downloaded++))
                continue
            }
        fi
    fi
    
    echo "❌"
    echo "    ⚠️  Échec: $url"
    ((failed++))
done

cd ../..

echo ""
echo "📊 Résumé:"
echo "   ✅ $downloaded / $total icônes téléchargées"
if [ $failed -gt 0 ]; then
    echo "   ❌ $failed échec(s)"
    echo ""
    echo "💡 Pour télécharger manuellement les icônes manquantes:"
    echo "   cd static/icons"
    for icon_entry in "${icons_data[@]}"; do
        filename="${icon_entry%%|*}"
        url="${icon_entry#*|}"
        if [ ! -f "static/icons/$filename" ]; then
            echo "   curl -L \"$url\" -o \"$filename\""
        fi
    done
else
    echo "   ✅ Toutes les icônes ont été téléchargées avec succès!"
fi
echo ""

