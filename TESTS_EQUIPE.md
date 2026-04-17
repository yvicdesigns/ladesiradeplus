# 📋 Protocole de Tests — La Desirade Plus
**Version :** 1.0 — Avril 2026  
**À remplir par :** Équipe QA / Testeurs  
**Objectif :** Valider que toutes les fonctionnalités de l'application fonctionnent correctement avant la mise en ligne.

---

## Instructions générales

- Testez sur un **vrai téléphone** (pas uniquement sur ordinateur)
- Notez le résultat de chaque test : ✅ **Réussi** | ❌ **Échoué** | ⚠️ **Partiel**
- Si un test échoue, notez **ce qui s'est passé** dans la colonne "Observations"
- Les tests marqués **[CLIENT]** se font depuis l'app côté client
- Les tests marqués **[ADMIN]** se font depuis le dashboard administrateur
- Certains tests nécessitent **deux appareils** (un client + un admin)

---

## Tableau de suivi global

| ID | Catégorie | Nom du test | Résultat | Observations |
|----|-----------|-------------|----------|--------------|
| NAV-01 | Navigation | Accès aux pages principales | | |
| NAV-02 | Navigation | Menu hamburger mobile | | |
| NAV-03 | Navigation | Lien actif dans la navigation | | |
| MENU-01 | Menu | Affichage des plats | | |
| MENU-03 | Menu | Filtres par catégorie | | |
| MENU-04 | Menu | Recherche de plats | | |
| MENU-05 | Menu | Ajout au panier | | |
| CART-01 | Panier | Affichage du panier | | |
| CART-02 | Panier | Modifier les quantités | | |
| CART-03 | Panier | Supprimer un article | | |
| CART-04 | Panier | Calcul du total | | |
| CART-05 | Panier | Panier vide | | |
| CHECK-01 | Commande | Choix type de commande | | |
| CHECK-02 | Commande | Validation du formulaire | | |
| CHECK-03 | Commande | Frais de livraison | | |
| CHECK-04 | Commande | Soumettre une commande | | |
| CHECK-05 | Commande | Choix du paiement | | |
| TRACK-01 | Suivi | Page de suivi | | |
| TRACK-02 | Suivi | Timeline des statuts | | |
| TRACK-03 | Suivi | Mise à jour en temps réel | | |
| AUTH-01 | Compte | Inscription | | |
| AUTH-02 | Compte | Connexion | | |
| AUTH-03 | Compte | Déconnexion | | |
| AUTH-04 | Compte | Mauvais mot de passe | | |
| DELIV-01 | Livraison | Commande de bout en bout | | |
| DELIV-02 | Livraison | Commande annulée | | |
| NOTIF-01 | Notifications | Son nouvelle commande | | |
| NOTIF-02 | Notifications | Annonce vocale | | |
| NOTIF-03 | Notifications | Bannière d'alerte | | |
| AUTO-01 | Flux Auto | Progression automatique | | |
| AUTO-02 | Flux Auto | Priorité action manuelle | | |
| PAY-01 | Paiement | Label paiement à la livraison | | |
| PAY-02 | Paiement | Confirmation de paiement | | |
| DEV-01 | Appareil | Installation PWA | | |
| DEV-02 | Appareil | Son sur tablette | | |

---

---

# SECTION 1 — NAVIGATION

---

## NAV-01 · Accès aux pages principales

**Objectif :** Vérifier que toutes les pages s'ouvrent sans erreur.

**Étapes :**
1. Ouvrir l'application
2. Aller sur la page d'accueil (`/`)
3. Aller sur le menu (`/menu`)
4. Aller sur le panier (`/cart`)
5. Aller sur la page de commande (`/checkout`)

**Résultat attendu :** Chaque page s'affiche correctement, pas d'écran blanc, pas de message d'erreur.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## NAV-02 · Menu hamburger sur mobile

**Objectif :** Vérifier que le menu s'ouvre et se ferme sur téléphone.

**Étapes :**
1. Ouvrir l'app sur un téléphone
2. Appuyer sur l'icône ☰ (hamburger) en haut
3. Vérifier que le menu s'affiche avec tous les liens
4. Appuyer sur × ou en dehors du menu pour le fermer
5. Vérifier que le menu se ferme

**Résultat attendu :** Le menu s'ouvre et se ferme sans problème. Tous les liens sont visibles.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## NAV-03 · Lien actif dans la navigation

**Objectif :** Vérifier que la page courante est mise en surbrillance dans le menu.

**Étapes :**
1. Cliquer sur "Menu" dans la navigation
2. Vérifier que le lien "Menu" a un style différent (couleur, gras)
3. Cliquer sur "Accueil"
4. Vérifier que "Accueil" est maintenant mis en surbrillance

**Résultat attendu :** Le lien de la page active a un style distinct.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

---

# SECTION 2 — MENU

---

## MENU-01 · Affichage des plats

**Objectif :** Vérifier que les plats s'affichent correctement.

**Étapes :**
1. Aller sur `/menu`
2. Attendre que la page se charge
3. Vérifier que les plats apparaissent avec : nom, prix, description, image

**Résultat attendu :** La liste des plats est visible, les images s'affichent, les prix sont affichés.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## MENU-03 · Filtres par catégorie

**Objectif :** Vérifier que les filtres fonctionnent.

**Étapes :**
1. Sur la page menu, cliquer sur une catégorie (ex : "Boissons")
2. Vérifier que seuls les articles de cette catégorie s'affichent
3. Cliquer sur "Tout" pour réinitialiser
4. Vérifier que tous les plats réapparaissent

**Résultat attendu :** Le filtre affiche uniquement les plats correspondants.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## MENU-04 · Recherche de plats

**Objectif :** Vérifier que la barre de recherche filtre les plats.

**Étapes :**
1. Cliquer sur la barre de recherche
2. Taper le nom d'un plat connu
3. Vérifier que la liste se met à jour instantanément

**Résultat attendu :** La liste affiche uniquement les plats correspondant à la recherche.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## MENU-05 · Ajout au panier

**Objectif :** Vérifier qu'un plat peut être ajouté au panier.

**Étapes :**
1. Cliquer sur le bouton "+" ou "Ajouter" d'un plat
2. Vérifier que le compteur du panier augmente (ex: 0 → 1)
3. Vérifier qu'une notification de succès apparaît

**Résultat attendu :** L'article est ajouté, le badge du panier se met à jour, une confirmation apparaît.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

---

# SECTION 3 — PANIER

---

## CART-01 · Affichage du panier

**Objectif :** Vérifier que les articles ajoutés apparaissent dans le panier.

**Étapes :**
1. Ajouter un article depuis le menu
2. Aller sur `/cart`
3. Vérifier que l'article est bien affiché avec son nom, image et prix

**Résultat attendu :** Le panier affiche correctement tous les articles ajoutés.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## CART-02 · Modifier les quantités

**Objectif :** Vérifier que les boutons + et - fonctionnent.

**Étapes :**
1. Dans le panier, appuyer sur "+" d'un article
2. Vérifier que la quantité augmente et que le sous-total se recalcule
3. Appuyer sur "-"
4. Vérifier que la quantité diminue

**Résultat attendu :** Quantité et total se mettent à jour immédiatement.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## CART-03 · Supprimer un article

**Objectif :** Vérifier que l'icône corbeille supprime l'article.

**Étapes :**
1. Dans le panier, appuyer sur l'icône 🗑️ d'un article
2. Vérifier que l'article disparaît de la liste
3. Vérifier que le total se recalcule

**Résultat attendu :** L'article est supprimé, le total est mis à jour.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## CART-04 · Calcul du total

**Objectif :** Vérifier que les calculs sont corrects.

**Étapes :**
1. Ajouter 2 articles différents avec des prix connus
2. Calculer manuellement : prix A × qté + prix B × qté
3. Comparer avec le sous-total affiché

**Résultat attendu :** Le total affiché correspond au calcul manuel.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## CART-05 · Panier vide

**Objectif :** Vérifier le message quand le panier est vide.

**Étapes :**
1. Supprimer tous les articles du panier (ou aller sur /cart sans articles)
2. Vérifier l'affichage

**Résultat attendu :** Un message "Panier vide" apparaît avec un bouton pour retourner au menu.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

---

# SECTION 4 — COMMANDE (CHECKOUT)

---

## CHECK-01 · Choix du type de commande

**Objectif :** Vérifier que le formulaire s'adapte selon le type de commande.

**Étapes :**
1. Aller sur `/checkout`
2. Sélectionner "Livraison"
3. Vérifier que des champs d'adresse apparaissent
4. Sélectionner "Sur Place"
5. Vérifier que les champs d'adresse disparaissent

**Résultat attendu :** Le formulaire s'adapte selon le type de commande sélectionné.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## CHECK-02 · Validation du formulaire

**Objectif :** Vérifier que les champs obligatoires bloquent la soumission si vides.

**Étapes :**
1. Sur la page checkout, laisser tous les champs vides
2. Cliquer sur "Commander" ou "Valider"
3. Vérifier qu'un message d'erreur apparaît sous les champs requis

**Résultat attendu :** Des messages d'erreur rouges apparaissent sur les champs vides. La commande n'est pas envoyée.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## CHECK-03 · Frais de livraison

**Objectif :** Vérifier que les frais de livraison s'ajoutent au total.

**Étapes :**
1. Sélectionner "Sur Place" — noter le total
2. Sélectionner "Livraison"
3. Vérifier que le total inclut maintenant des frais de livraison

**Résultat attendu :** Le total augmente du montant des frais de livraison.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## CHECK-04 · Soumettre une commande

**Objectif :** Vérifier qu'une commande valide est bien créée.

**Étapes :**
1. Remplir tous les champs requis correctement
2. Choisir un mode de paiement
3. Cliquer sur "Commander"
4. Observer le chargement
5. Vérifier la redirection vers une page de confirmation

**Résultat attendu :** La commande est créée, une page de confirmation ou de suivi s'affiche.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## CHECK-05 · Choix du mode de paiement

**Objectif :** Vérifier les différents modes de paiement disponibles.

**Étapes :**
1. Sur la page checkout, sélectionner "Paiement à la livraison"
2. Vérifier le texte affiché
3. Sélectionner "Mobile Money"
4. Vérifier que les instructions Mobile Money apparaissent

**Résultat attendu :** Chaque option affiche les bonnes informations et instructions.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

---

# SECTION 5 — SUIVI DE COMMANDE

---

## TRACK-01 · Page de suivi

**Objectif :** Vérifier que la page de suivi s'affiche correctement.

**Étapes :**
1. Après avoir passé une commande, noter le lien de suivi
2. Ouvrir ce lien (`/track-order/XXXX`)
3. Vérifier l'affichage : numéro de commande, statut, liste des articles

**Résultat attendu :** La page affiche toutes les informations de la commande.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## TRACK-02 · Timeline des statuts

**Objectif :** Vérifier que la progression est bien représentée visuellement.

**Étapes :**
1. Ouvrir la page de suivi d'une commande en cours
2. Observer la timeline des étapes (En attente → Confirmée → En préparation → Prête → En route → Livrée)
3. Vérifier que l'étape actuelle est mise en évidence, les précédentes cochées, les suivantes grisées

**Résultat attendu :** La timeline reflète fidèlement le statut actuel.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## TRACK-03 · Mise à jour en temps réel ⭐ Important

**Objectif :** Vérifier que la page de suivi se met à jour sans recharger.

**Prérequis :** Deux appareils ou deux onglets

**Étapes :**
1. [CLIENT] Ouvrir la page de suivi d'une commande "En attente"
2. [ADMIN] Dans le dashboard, passer la commande à "Confirmée"
3. [CLIENT] Vérifier que la page de suivi se met à jour **automatiquement** (sans appuyer sur rafraîchir)

**Résultat attendu :** Le statut change à l'écran en moins de 5 secondes sans rechargement.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

---

# SECTION 6 — COMPTE CLIENT

---

## AUTH-01 · Inscription

**Objectif :** Vérifier qu'un nouveau compte peut être créé.

**Étapes :**
1. Aller sur `/login`
2. Basculer sur "Créer un compte" (Inscription)
3. Entrer un email valide et un mot de passe (min. 6 caractères)
4. Valider

**Résultat attendu :** Le compte est créé, l'utilisateur est connecté ou reçoit un email de confirmation.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## AUTH-02 · Connexion

**Objectif :** Vérifier qu'un compte existant peut se connecter.

**Étapes :**
1. Aller sur `/login`
2. Entrer un email et mot de passe valides
3. Cliquer sur "Se connecter"
4. Vérifier que l'icône de profil apparaît dans le header

**Résultat attendu :** L'utilisateur est connecté et redirigé.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## AUTH-03 · Déconnexion

**Objectif :** Vérifier que la déconnexion fonctionne.

**Étapes :**
1. Se connecter
2. Cliquer sur l'icône de profil ou le menu
3. Cliquer sur "Déconnexion"
4. Vérifier que la session est terminée (retour à l'état non connecté)

**Résultat attendu :** L'utilisateur est déconnecté, les pages protégées ne sont plus accessibles.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## AUTH-04 · Mauvais mot de passe

**Objectif :** Vérifier le message d'erreur sur mauvaises credentials.

**Étapes :**
1. Sur la page de connexion, entrer un email valide avec un mauvais mot de passe
2. Cliquer sur "Se connecter"

**Résultat attendu :** Un message d'erreur s'affiche ("Identifiants incorrects" ou similaire). L'app ne plante pas.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

---

# SECTION 7 — FLUX LIVRAISON (ADMIN + CLIENT)

> ⚠️ Ces tests nécessitent **deux personnes** : une côté client, une côté admin

---

## DELIV-01 · Commande complète de bout en bout ⭐ Test Critique

**Objectif :** Simuler une vraie commande de livraison du début à la fin.

**Durée estimée :** 15-20 minutes

**Étapes :**

| # | Qui | Action | Résultat attendu |
|---|-----|--------|-----------------|
| 1 | CLIENT | Ouvrir l'app, aller sur le menu | Menu visible |
| 2 | CLIENT | Ajouter 2-3 plats au panier | Panier mis à jour |
| 3 | CLIENT | Aller sur Checkout → Livraison → remplir adresse → Commander | Page de confirmation |
| 4 | ADMIN | Ouvrir dashboard → Commandes Livraison | Commande visible en "En attente" |
| 5 | ADMIN | Cliquer "Confirmer" | Statut → "Confirmée" |
| 6 | CLIENT | Vérifier la page de suivi | Affiche "Confirmée" |
| 7 | ADMIN | Cliquer "En préparation" | Statut → "En préparation" |
| 8 | ADMIN | Cliquer "Prête" | Statut → "Prête" |
| 9 | ADMIN | Cliquer "En route" | Statut → "En route" |
| 10 | CLIENT | Vérifier la page de suivi | Affiche "En route" |
| 11 | ADMIN | Cliquer "Livrée" | Statut → "Livrée" |
| 12 | CLIENT | Vérifier dans l'historique | Commande marquée "Livrée" |

**Résultat global :** ✅ / ❌ / ⚠️  
**Observations :**

---

## DELIV-02 · Commande annulée par l'admin

**Objectif :** Vérifier le comportement quand une commande est annulée.

**Étapes :**
1. [CLIENT] Passer une commande de livraison
2. [ADMIN] Dans le détail de la commande, cliquer "Annuler"
3. [ADMIN] Confirmer l'annulation dans la boîte de dialogue
4. [ADMIN] Vérifier que la commande n'apparaît plus dans les commandes actives
5. [CLIENT] Vérifier que la page de suivi affiche le statut annulé

**Résultat attendu :** La commande est annulée des deux côtés.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

---

# SECTION 8 — NOTIFICATIONS ADMIN

> Ces tests se font côté **admin uniquement**

---

## NOTIF-01 · Son lors d'une nouvelle commande ⭐

**Objectif :** Vérifier que le son se déclenche quand une commande arrive.

**Prérequis :** Volume du téléphone/tablette admin au maximum

**Étapes :**
1. [ADMIN] Ouvrir le dashboard sur la tablette ou l'ordinateur admin
2. [CLIENT] Passer une nouvelle commande
3. [ADMIN] Écouter

**Résultat attendu :** Un son d'alerte (2 bips) se déclenche clairement sur l'appareil admin.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## NOTIF-02 · Annonce vocale après les bips

**Objectif :** Vérifier l'annonce vocale "Vous avez une nouvelle commande en attente".

**Étapes :**
1. Même setup que NOTIF-01
2. [CLIENT] Passer une nouvelle commande
3. [ADMIN] Écouter — après les 2 bips, attendre environ 3 secondes

**Résultat attendu :** Une voix annonce "Vous avez une nouvelle commande en attente" après les bips.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## NOTIF-03 · Bannière d'alerte persistante

**Objectif :** Vérifier que la bannière rouge apparaît sur le dashboard admin.

**Étapes :**
1. [CLIENT] Passer une commande
2. [ADMIN] Observer le haut de l'écran admin

**Résultat attendu :** Une bannière rouge/orange apparaît en haut avec le nombre de commandes en attente et un bouton "Voir les commandes".

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## NOTIF-04 · Répétition toutes les 30 secondes

**Objectif :** Vérifier que le son se répète si l'admin ne répond pas.

**Étapes :**
1. [CLIENT] Passer une commande
2. [ADMIN] Ne pas cliquer sur "Voir les commandes" ni fermer la bannière
3. [ADMIN] Attendre 30 secondes
4. Écouter

**Résultat attendu :** Les bips + voix se répètent automatiquement toutes les 30 secondes tant que la commande n'est pas traitée.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## NOTIF-05 · Arrêt des alertes après validation

**Objectif :** Vérifier que les alertes s'arrêtent quand la commande est traitée.

**Étapes :**
1. [CLIENT] Passer une commande (bannière apparaît)
2. [ADMIN] Cliquer "Voir les commandes" dans la bannière
3. [ADMIN] Confirmer la commande

**Résultat attendu :** La bannière disparaît, les répétitions sonores s'arrêtent.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

---

# SECTION 9 — PROGRESSION AUTOMATIQUE

---

## AUTO-01 · Progression automatique des statuts

**Objectif :** Vérifier que les commandes avancent seules si l'admin ne valide pas.

> Note : Ce test peut prendre du temps selon les délais configurés dans Paramètres → Flux Auto

**Étapes :**
1. [CLIENT] Passer une commande de livraison
2. [ADMIN] Ne pas toucher à la commande
3. Attendre le délai configuré pour "En attente → Confirmée" (ex: 3 minutes)
4. [ADMIN] Rafraîchir le dashboard

**Résultat attendu :** La commande est automatiquement passée à "Confirmée" sans action de l'admin.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## AUTO-02 · L'admin peut toujours valider manuellement ⭐

**Objectif :** Vérifier que l'admin garde la priorité sur la progression automatique.

**Étapes :**
1. [CLIENT] Passer une commande (statut "En attente")
2. [ADMIN] Sans attendre le délai automatique, cliquer "Confirmer" manuellement
3. [ADMIN] Vérifier que la commande passe immédiatement à "Confirmée"

**Résultat attendu :** La validation manuelle fonctionne immédiatement, sans attendre les timers.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

---

# SECTION 10 — PAIEMENT

---

## PAY-01 · Label "Paiement à la livraison"

**Objectif :** Vérifier que le bon libellé s'affiche pour le paiement en espèces.

**Étapes :**
1. [CLIENT] Aller sur checkout
2. Sélectionner "Paiement à la livraison" (ou espèces)
3. Vérifier le texte affiché dans le récapitulatif

**Résultat attendu :** Le libellé affiché est "Paiement à la livraison" (et non "Cash" ou autre terme technique).

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## PAY-02 · Confirmation de paiement côté admin

**Objectif :** Vérifier que l'admin peut confirmer la réception du paiement.

**Étapes :**
1. [CLIENT] Passer une commande avec paiement à la livraison
2. [ADMIN] Ouvrir le détail de la commande
3. [ADMIN] Chercher un bouton ou option "Paiement reçu" / "Confirmer paiement"
4. [ADMIN] Confirmer le paiement

**Résultat attendu :** Le statut de paiement est mis à jour dans la commande.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

---

# SECTION 11 — TESTS SUR APPAREIL RÉEL

> Ces tests se font obligatoirement sur un vrai téléphone ou tablette, pas sur ordinateur

---

## DEV-01 · Installation PWA (ajout à l'écran d'accueil)

**Objectif :** Vérifier que l'app peut être installée comme une app native.

**Sur Android (Chrome) :**
1. Ouvrir l'app dans Chrome
2. Appuyer sur les 3 points (menu)
3. Sélectionner "Ajouter à l'écran d'accueil"
4. Confirmer

**Sur iPhone (Safari) :**
1. Ouvrir l'app dans Safari
2. Appuyer sur le bouton Partager (📤)
3. Sélectionner "Sur l'écran d'accueil"
4. Confirmer

**Résultat attendu :** L'icône de l'app apparaît sur l'écran d'accueil. En appuyant dessus, l'app s'ouvre en plein écran sans la barre du navigateur.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## DEV-02 · Son sur tablette admin

**Objectif :** Vérifier que les alertes sonores fonctionnent sur la tablette utilisée par l'admin.

**Prérequis :** Volume de la tablette à fond

**Étapes :**
1. Ouvrir le dashboard admin sur la tablette
2. Aller dans Paramètres → Sons → Tester le son
3. Vérifier que le son est clairement audible

**Résultat attendu :** Le son d'alerte est fort et clair, pas de silence, pas d'erreur.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

## DEV-03 · Affichage du dashboard sur tablette

**Objectif :** Vérifier que l'interface admin est lisible sur tablette.

**Étapes :**
1. Ouvrir le dashboard admin sur la tablette
2. Naviguer sur : Commandes Livraison, Paramètres, Flux Auto
3. Vérifier que les boutons sont suffisamment grands pour le tactile
4. Vérifier qu'il n'y a pas de texte tronqué ni de boutons qui se chevauchent

**Résultat attendu :** Interface claire, utilisable au doigt, sans problème d'affichage.

**Résultat :** ✅ / ❌ / ⚠️  
**Observations :**

---

---

# RÉSUMÉ FINAL

| Catégorie | Total tests | Réussis | Échoués | Partiels |
|-----------|-------------|---------|---------|----------|
| Navigation | 3 | | | |
| Menu | 4 | | | |
| Panier | 5 | | | |
| Commande | 5 | | | |
| Suivi | 3 | | | |
| Compte | 4 | | | |
| Livraison | 2 | | | |
| Notifications | 5 | | | |
| Flux Auto | 2 | | | |
| Paiement | 2 | | | |
| Appareil réel | 3 | | | |
| **TOTAL** | **38** | | | |

---

**Testeur(s) :** ___________________________  
**Date des tests :** ___________________________  
**Version de l'app :** ___________________________  
**Appareil(s) utilisé(s) :** ___________________________

**Conclusion générale :**  
☐ Application prête pour la mise en ligne  
☐ Corrections nécessaires avant mise en ligne (voir observations ci-dessus)

---

*Document généré pour La Desirade Plus — Usage interne*
