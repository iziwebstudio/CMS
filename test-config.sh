#!/bin/bash

# ====================================================================
# Script de Test - StackPages CMS Mode Local
# ====================================================================
# Ce script vérifie que tout est correctement configuré

echo "🔍 Vérification de la configuration StackPages CMS..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteur de tests
TESTS_PASSED=0
TESTS_FAILED=0

# Fonction de test
test_check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((TESTS_FAILED++))
    fi
}

# Test 1 : Vérifier que _worker.js existe
echo "📝 Test 1 : Fichier worker..."
[ -f "_worker.js" ]
test_check $? "Fichier _worker.js existe"

# Test 2 : Vérifier que wrangler.toml existe
echo "📝 Test 2 : Configuration Wrangler..."
[ -f "wrangler.toml" ]
test_check $? "Fichier wrangler.toml existe"

# Test 3 : Vérifier que admin.js est modifié (mode local)
echo "📝 Test 3 : Configuration admin.js..."
if grep -q "MODE LOCAL" "core/admin.js"; then
    test_check 0 "admin.js configuré en mode local"
else
    test_check 1 "admin.js pas configuré en mode local"
fi

# Test 4 : Vérifier que dashboard.html n'active pas le mode public
echo "📝 Test 4 : Configuration dashboard.html..."
if grep -q "<!-- MODE LOCAL ACTIVÉ" "admin/dashboard.html"; then
    test_check 0 "dashboard.html en mode local"
else
    test_check 1 "dashboard.html pas en mode local"
fi

# Test 5 : Vérifier que .gitignore existe
echo "📝 Test 5 : Protection des secrets..."
[ -f ".gitignore" ]
test_check $? "Fichier .gitignore existe"

# Test 6 : Vérifier que .dev.vars.example existe
echo "📝 Test 6 : Template variables d'environnement..."
[ -f ".dev.vars.example" ]
test_check $? "Fichier .dev.vars.example existe"

# Test 7 : Vérifier NPX disponible
echo "📝 Test 7 : Outils de développement..."
which npx > /dev/null 2>&1
test_check $? "NPX est installé"

# Test 8 : Vérifier structure des dossiers
echo "📝 Test 8 : Structure du projet..."
[ -d "admin" ] && [ -d "core" ]
test_check $? "Dossiers admin/ et core/ existent"

# Test 9 : Vérifier fichiers HTML principaux
echo "📝 Test 9 : Fichiers frontend..."
[ -f "index.html" ] && [ -f "admin/index.html" ] && [ -f "admin/dashboard.html" ]
test_check $? "Fichiers HTML principaux existent"

# Test 10 : Avertir si .dev.vars n'existe pas
echo "📝 Test 10 : Variables d'environnement..."
if [ -f ".dev.vars" ]; then
    test_check 0 "Fichier .dev.vars existe (prêt pour dev local)"
else
    echo -e "${YELLOW}⚠️  Fichier .dev.vars n'existe pas${NC}"
    echo -e "${YELLOW}   → Exécuter: cp .dev.vars.example .dev.vars${NC}"
    echo -e "${YELLOW}   → Puis éditer .dev.vars avec vos vraies valeurs${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "======================================================================"
echo -e "${GREEN}Tests réussis : $TESTS_PASSED${NC}"
echo -e "${RED}Tests échoués : $TESTS_FAILED${NC}"
echo "======================================================================"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Tout est OK ! Vous pouvez lancer le worker :${NC}"
    echo -e "${GREEN}   npx wrangler dev${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Certains tests ont échoué. Vérifier la configuration.${NC}"
    echo ""
    exit 1
fi
