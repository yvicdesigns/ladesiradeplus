export const TEST_STATUS = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  WARNING: 'WARNING',
  NOT_RUN: 'NOT_RUN'
};

export const TEST_CATEGORIES = [
  'Navigation',
  'HomePage',
  'MenuPage',
  'CartPage',
  'CheckoutPage',
  'OrderTracking',
  'Authentication',
  'UserProfile',
  'ResponsiveDesign',
  'ErrorHandling',
  'DeliveryWorkflow',
  'AdminNotifications',
  'AutoProgression',
  'PaymentValidation',
  'DeviceTesting'
];

export const MANUAL_TESTS = [
  // CATEGORY: Navigation
  {
    id: 'NAV-01',
    category: 'Navigation',
    name: 'Core Routes Accessibility',
    description: 'Verify all core routes (/, /menu, /cart, /checkout, /profile) are accessible via direct URL.',
    expectedBehavior: 'Page loads without 404 or white screen. Correct component is rendered.',
    steps: ['Navigate to /', 'Navigate to /menu', 'Navigate to /cart', 'Navigate to /checkout', 'Navigate to /profile']
  },
  {
    id: 'NAV-02',
    category: 'Navigation',
    name: 'Mobile Menu Hamburger',
    description: 'Verify mobile menu opens and closes correctly on mobile viewports.',
    expectedBehavior: 'Hamburger icon visible on mobile. Clicking opens sidebar/drawer. Clicking X or outside closes it.',
    steps: ['Resize window to 375px', 'Click hamburger icon', 'Verify menu items', 'Close menu']
  },
  {
    id: 'NAV-03',
    category: 'Navigation',
    name: 'Active Link States',
    description: 'Verify the current active route is highlighted in the navigation bar.',
    expectedBehavior: 'The link corresponding to the current page has distinct styling (e.g., primary color, bold).',
    steps: ['Click "Menu" in header', 'Observe "Menu" link styling', 'Click "Cart" in header', 'Observe "Cart" link styling']
  },
  {
    id: 'NAV-04',
    category: 'Navigation',
    name: 'Responsive Header Layout',
    description: 'Verify header adapts correctly from desktop to mobile.',
    expectedBehavior: 'Desktop shows full links. Mobile hides links and shows hamburger. Logo remains visible.',
    steps: ['Start at 1200px width', 'Slowly resize down to 320px', 'Observe header element transitions']
  },
  {
    id: 'NAV-05',
    category: 'Navigation',
    name: 'Breadcrumbs/Back Buttons',
    description: 'Verify back buttons on deep pages (like product details) work correctly.',
    expectedBehavior: 'Clicking back button returns to previous page state without losing context.',
    steps: ['Go to /menu', 'Click a product to view details', 'Click back arrow in header', 'Verify return to menu']
  },

  // CATEGORY: HomePage
  {
    id: 'HOME-01',
    category: 'HomePage',
    name: 'Hero Section Display',
    description: 'Verify hero section loads background image, title, and subtitle correctly.',
    expectedBehavior: 'Hero section is visually complete, text is readable, no broken images.',
    steps: ['Navigate to /', 'Inspect top hero area']
  },
  {
    id: 'HOME-02',
    category: 'HomePage',
    name: 'Categories Quick Links',
    description: 'Verify category cards/links navigate to filtered menu.',
    expectedBehavior: 'Clicking a category on homepage navigates to /menu with that category pre-selected.',
    steps: ['Click a category card (e.g., Pizza) on homepage', 'Verify redirection to Menu page', 'Verify menu is filtered by Pizza']
  },
  {
    id: 'HOME-03',
    category: 'HomePage',
    name: 'Call to Action (CTA) Buttons',
    description: 'Verify primary CTA buttons function correctly.',
    expectedBehavior: '"Commander" or "Voir le Menu" buttons navigate to the Menu page.',
    steps: ['Find main CTA button in Hero section', 'Click it', 'Verify it goes to /menu']
  },
  {
    id: 'HOME-04',
    category: 'HomePage',
    name: 'Responsive Homepage Layout',
    description: 'Verify grid layouts on homepage stack correctly on mobile.',
    expectedBehavior: 'Grid items (categories, featured items) stack in 1 column on mobile, 2+ on desktop.',
    steps: ['View homepage on desktop', 'Resize to mobile (375px)', 'Verify sections stack vertically without horizontal scroll']
  },

  // CATEGORY: MenuPage
  {
    id: 'MENU-01',
    category: 'MenuPage',
    name: 'Product List Display',
    description: 'Verify menu items are fetched and displayed.',
    expectedBehavior: 'List of products appears with names, prices, and descriptions.',
    steps: ['Navigate to /menu', 'Wait for loading to finish', 'Verify items are visible']
  },
  {
    id: 'MENU-02',
    category: 'MenuPage',
    name: 'Image Loading & Fallbacks',
    description: 'Verify product images load, or show placeholder if missing.',
    expectedBehavior: 'All items have an image. Broken URLs show a fallback image, not a broken link icon.',
    steps: ['Scroll through menu items', 'Observe image elements']
  },
  {
    id: 'MENU-03',
    category: 'MenuPage',
    name: 'Category Filtering',
    description: 'Verify clicking category pills filters the product list.',
    expectedBehavior: 'Clicking a category shows only items belonging to that category.',
    steps: ['Click a category filter (e.g., "Boissons")', 'Verify displayed items match the category', 'Click "Tout" to reset']
  },
  {
    id: 'MENU-04',
    category: 'MenuPage',
    name: 'Search Functionality',
    description: 'Verify search input filters items by name.',
    expectedBehavior: 'Typing in search updates the list to match query instantly.',
    steps: ['Click search bar', 'Type a known product name', 'Verify list updates correctly']
  },
  {
    id: 'MENU-05',
    category: 'MenuPage',
    name: 'Add to Cart from Menu',
    description: 'Verify clicking "+" or "Add" puts item in cart and shows toast.',
    expectedBehavior: 'Cart counter increments, success toast appears.',
    steps: ['Click Add button on an item', 'Check cart badge count', 'Check for success notification']
  },
  {
    id: 'MENU-06',
    category: 'MenuPage',
    name: 'Price Formatting',
    description: 'Verify prices display correctly with currency symbols.',
    expectedBehavior: 'Prices show as "X,XX €" or "X FCFA" depending on config, without NaN or undefined.',
    steps: ['Inspect price displays on various items']
  },

  // CATEGORY: CartPage
  {
    id: 'CART-01',
    category: 'CartPage',
    name: 'Cart Display',
    description: 'Verify added items appear in the cart page.',
    expectedBehavior: 'Cart page shows correct items, names, images, and prices.',
    steps: ['Add item to cart', 'Navigate to /cart', 'Verify item details match']
  },
  {
    id: 'CART-02',
    category: 'CartPage',
    name: 'Quantity Modification',
    description: 'Verify + and - buttons update item quantity and totals.',
    expectedBehavior: 'Quantity changes, subtotal updates immediately.',
    steps: ['In cart, click + on an item', 'Verify quantity increases', 'Verify subtotal increases', 'Click -', 'Verify decrease']
  },
  {
    id: 'CART-03',
    category: 'CartPage',
    name: 'Item Deletion',
    description: 'Verify trash icon removes item completely.',
    expectedBehavior: 'Item disappears from list, cart count updates, totals recalculate.',
    steps: ['Click trash icon next to item', 'Verify item is removed']
  },
  {
    id: 'CART-04',
    category: 'CartPage',
    name: 'Total Calculations',
    description: 'Verify subtotal, taxes (if applicable), and total are mathematically correct.',
    expectedBehavior: 'Sum of (price * quantity) equals Subtotal.',
    steps: ['Add 2 different items', 'Calculate sum manually', 'Compare with displayed subtotal']
  },
  {
    id: 'CART-05',
    category: 'CartPage',
    name: 'Empty Cart State',
    description: 'Verify cart shows empty state message when no items exist.',
    expectedBehavior: 'Displays "Panier vide" message and button to return to menu.',
    steps: ['Remove all items from cart', 'Verify empty state UI']
  },
  {
    id: 'CART-06',
    category: 'CartPage',
    name: 'Proceed to Checkout Button',
    description: 'Verify checkout button routes to checkout page if cart not empty.',
    expectedBehavior: 'Clicking "Payer" or "Commander" goes to /checkout.',
    steps: ['Ensure cart has items', 'Click Checkout button', 'Verify route changes to /checkout']
  },

  // CATEGORY: CheckoutPage
  {
    id: 'CHECK-01',
    category: 'CheckoutPage',
    name: 'Order Type Selection',
    description: 'Verify switching between "Sur Place" and "Livraison" updates forms.',
    expectedBehavior: 'Selecting Delivery shows address fields. Sur Place hides them or shows table selection.',
    steps: ['Navigate to /checkout', 'Toggle order type options', 'Verify form fields change']
  },
  {
    id: 'CHECK-02',
    category: 'CheckoutPage',
    name: 'Form Validation',
    description: 'Verify required fields prevent submission if empty.',
    expectedBehavior: 'Submitting empty form shows red validation errors under required fields.',
    steps: ['Leave required fields empty', 'Click submit', 'Verify error messages']
  },
  {
    id: 'CHECK-03',
    category: 'CheckoutPage',
    name: 'Delivery Fee Calculation',
    description: 'Verify delivery fee is added to total when delivery is selected.',
    expectedBehavior: 'Total increases by delivery fee amount when switching to Delivery.',
    steps: ['Select Sur Place, note total', 'Select Livraison', 'Verify total includes delivery fee']
  },
  {
    id: 'CHECK-04',
    category: 'CheckoutPage',
    name: 'Order Creation (Submit)',
    description: 'Verify successful form submission creates order and redirects.',
    expectedBehavior: 'Clicking submit shows loading, then redirects to confirmation/tracking page.',
    steps: ['Fill all required fields validly', 'Click submit', 'Verify redirect to success page']
  },
  {
    id: 'CHECK-05',
    category: 'CheckoutPage',
    name: 'Payment Method Selection',
    description: 'Verify user can select different payment methods (Cash, Mobile Money).',
    expectedBehavior: 'Selecting different payment methods updates the UI accordingly.',
    steps: ['Select Cash payment', 'Select Mobile Money', 'Verify UI updates (e.g., shows instructions)']
  },
  {
    id: 'CHECK-06',
    category: 'CheckoutPage',
    name: 'Cart Persistence on Refresh',
    description: 'Verify cart data is not lost if user refreshes checkout page.',
    expectedBehavior: 'Refreshing /checkout keeps items and calculated totals.',
    steps: ['Add items to cart', 'Go to checkout', 'Refresh page (F5)', 'Verify totals remain']
  },

  // CATEGORY: OrderTracking
  {
    id: 'TRACK-01',
    category: 'OrderTracking',
    name: 'Tracking Page Display',
    description: 'Verify tracking page loads order details correctly.',
    expectedBehavior: 'Shows order ID, status timeline, and item summary.',
    steps: ['Navigate to a valid /track-order/:id URL', 'Verify data displays']
  },
  {
    id: 'TRACK-02',
    category: 'OrderTracking',
    name: 'Status Timeline UI',
    description: 'Verify visual timeline reflects current order status.',
    expectedBehavior: 'Current status is highlighted, past statuses are marked done, future are grayed.',
    steps: ['Inspect timeline steps for a pending or confirmed order']
  },
  {
    id: 'TRACK-03',
    category: 'OrderTracking',
    name: 'Real-time Updates',
    description: 'Verify page updates without refresh when order status changes in DB.',
    expectedBehavior: 'Status changes automatically when updated in admin panel.',
    steps: ['Open tracking page', 'Open admin panel in another tab', 'Change order status', 'Verify tracking page updates automatically']
  },
  {
    id: 'TRACK-04',
    category: 'OrderTracking',
    name: 'Invalid Order ID',
    description: 'Verify behavior when tracking ID does not exist.',
    expectedBehavior: 'Shows error message or "Order not found" instead of crashing.',
    steps: ['Navigate to /track-order/invalid-uuid-123', 'Verify error handling']
  },

  // CATEGORY: Authentication
  {
    id: 'AUTH-01',
    category: 'Authentication',
    name: 'Signup Flow',
    description: 'Verify new user registration works.',
    expectedBehavior: 'Successful registration logs user in or asks for email confirmation.',
    steps: ['Go to /login', 'Switch to Signup', 'Enter valid details', 'Submit']
  },
  {
    id: 'AUTH-02',
    category: 'Authentication',
    name: 'Login Flow',
    description: 'Verify existing user login works.',
    expectedBehavior: 'Successful login redirects to previous page or home, profile icon appears.',
    steps: ['Go to /login', 'Enter valid credentials', 'Submit', 'Verify logged in state']
  },
  {
    id: 'AUTH-03',
    category: 'Authentication',
    name: 'Logout Flow',
    description: 'Verify logout clears session.',
    expectedBehavior: 'Clicking logout removes user session, redirects to login or home, cart might clear.',
    steps: ['Click Logout in header/profile menu', 'Verify session is cleared']
  },
  {
    id: 'AUTH-04',
    category: 'Authentication',
    name: 'Invalid Credentials',
    description: 'Verify proper error message on wrong password.',
    expectedBehavior: 'Displays "Invalid login credentials" or similar, does not crash.',
    steps: ['Attempt login with wrong password', 'Verify error message']
  },
  {
    id: 'AUTH-05',
    category: 'Authentication',
    name: 'Session Persistence',
    description: 'Verify user remains logged in after page refresh.',
    expectedBehavior: 'Refreshing the page does not log the user out.',
    steps: ['Log in', 'Refresh page', 'Verify still logged in']
  },

  // CATEGORY: UserProfile
  {
    id: 'PROF-01',
    category: 'UserProfile',
    name: 'Profile Data Display',
    description: 'Verify user profile shows correct email and name.',
    expectedBehavior: 'Data matches authenticated user info.',
    steps: ['Navigate to /profile', 'Verify displayed details']
  },
  {
    id: 'PROF-02',
    category: 'UserProfile',
    name: 'Order History',
    description: 'Verify past orders are listed for the user.',
    expectedBehavior: 'Shows list of user\'s previous orders with dates and totals.',
    steps: ['Navigate to /orders or Profile -> Orders', 'Verify list is populated']
  },
  {
    id: 'PROF-03',
    category: 'UserProfile',
    name: 'Profile Edit',
    description: 'Verify user can update their name/phone.',
    expectedBehavior: 'Saving changes updates DB and UI.',
    steps: ['Edit profile fields', 'Save', 'Refresh', 'Verify changes persisted']
  },
  {
    id: 'PROF-04',
    category: 'UserProfile',
    name: 'Protected Route Enforcement',
    description: 'Verify unauthenticated users cannot access /profile.',
    expectedBehavior: 'Redirects to /login.',
    steps: ['Log out', 'Navigate directly to /profile', 'Verify redirect to /login']
  },

  // CATEGORY: ResponsiveDesign
  {
    id: 'RESP-01',
    category: 'ResponsiveDesign',
    name: 'Mobile Viewport (320px - 425px)',
    description: 'Verify layout on small screens.',
    expectedBehavior: 'No horizontal scrolling, tap targets are large enough, text is readable.',
    steps: ['Open DevTools', 'Set width to 375px', 'Browse Home, Menu, Cart']
  },
  {
    id: 'RESP-02',
    category: 'ResponsiveDesign',
    name: 'Tablet Viewport (768px - 1024px)',
    description: 'Verify layout on medium screens.',
    expectedBehavior: 'Grid adjusts to 2-3 columns, modals fit nicely.',
    steps: ['Set width to 768px', 'Verify layouts']
  },
  {
    id: 'RESP-03',
    category: 'ResponsiveDesign',
    name: 'Desktop Viewport (1280px+)',
    description: 'Verify layout on large screens.',
    expectedBehavior: 'Max-width containers center content, high-res images look good.',
    steps: ['Set width to 1440px', 'Verify layouts']
  },

  // CATEGORY: ErrorHandling
  {
    id: 'ERR-01',
    category: 'ErrorHandling',
    name: 'Network Disconnection',
    description: 'Verify app behavior when offline.',
    expectedBehavior: 'Shows offline banner or graceful error on fetch failure.',
    steps: ['Turn off network in DevTools', 'Try to navigate or fetch data', 'Verify error UI']
  },
  {
    id: 'ERR-02',
    category: 'ErrorHandling',
    name: 'Global Error Boundary',
    description: 'Verify component crashes do not take down whole app.',
    expectedBehavior: 'Caught by ErrorBoundary, shows fallback UI with retry button.',
    steps: ['Trigger a known UI bug if possible, or verify boundary exists in code']
  },
  {
    id: 'ERR-03',
    category: 'ErrorHandling',
    name: 'Missing Images',
    description: 'Verify broken image URLs do not break layout.',
    expectedBehavior: 'onError handler swaps to placeholder.',
    steps: ['Inspect elements with known missing images']
  },
  {
    id: 'ERR-04',
    category: 'ErrorHandling',
    name: '404 Page',
    description: 'Verify routing to non-existent page.',
    expectedBehavior: 'Shows custom 404 page or redirects to Home.',
    steps: ['Navigate to /this-page-does-not-exist', 'Verify result']
  },
  {
    id: 'ERR-05',
    category: 'ErrorHandling',
    name: 'Form Submission Errors',
    description: 'Verify API errors during submission are shown to user.',
    expectedBehavior: 'Toast notification or inline error appears if submission fails (e.g., network error during checkout).',
    steps: ['Block network request during checkout submit', 'Verify error toast']
  },

  // ============================================================
  // CATEGORY: DeliveryWorkflow — Flux complet de commande livraison
  // ============================================================
  {
    id: 'DELIV-01',
    category: 'DeliveryWorkflow',
    name: 'Commande de bout en bout — Livraison',
    description: 'Scénario complet : client passe une commande de livraison jusqu\'à la livraison finale.',
    expectedBehavior: 'Chaque étape du statut est visible côté client ET côté admin. Aucun blocage.',
    steps: [
      '1. [CLIENT] Ouvrir l\'app sur un téléphone, aller sur le menu',
      '2. [CLIENT] Ajouter 2-3 plats au panier, valider la commande livraison avec adresse',
      '3. [ADMIN] Vérifier que la commande apparaît dans le dashboard Livraisons avec statut "En attente"',
      '4. [ADMIN] Cliquer "Confirmer" — vérifier que le statut passe à "Confirmée"',
      '5. [CLIENT] Vérifier que la page de suivi affiche "Confirmée"',
      '6. [ADMIN] Cliquer "En préparation" — vérifier le statut',
      '7. [ADMIN] Cliquer "Prête" — vérifier le statut',
      '8. [ADMIN] Cliquer "En route" — vérifier le statut côté client',
      '9. [ADMIN] Cliquer "Livrée" — vérifier que la commande passe dans l\'historique',
      '10. [CLIENT] Vérifier que la commande est bien marquée "Livrée" dans l\'historique'
    ]
  },
  {
    id: 'DELIV-02',
    category: 'DeliveryWorkflow',
    name: 'Commande annulée par l\'admin',
    description: 'Vérifier le comportement quand l\'admin annule une commande en cours.',
    expectedBehavior: 'Statut passe à "Annulée", commande disparaît des actives, visible dans historique avec statut annulé.',
    steps: [
      '1. [CLIENT] Passer une commande de livraison',
      '2. [ADMIN] Dans le détail de la commande, cliquer "Annuler"',
      '3. [ADMIN] Confirmer l\'annulation dans la boîte de dialogue',
      '4. [ADMIN] Vérifier que la commande n\'apparaît plus dans les commandes actives',
      '5. [CLIENT] Vérifier que la page de suivi affiche le statut annulé'
    ]
  },
  {
    id: 'DELIV-03',
    category: 'DeliveryWorkflow',
    name: 'Détail commande — Informations complètes',
    description: 'Vérifier que le modal de détail d\'une commande affiche toutes les infos correctes.',
    expectedBehavior: 'Nom client, téléphone, adresse, liste des plats, montant total, méthode de paiement s\'affichent correctement.',
    steps: [
      '1. [ADMIN] Aller dans Livraisons',
      '2. [ADMIN] Cliquer sur "Voir" sur une commande',
      '3. Vérifier : Nom client visible',
      '4. Vérifier : Numéro de téléphone visible',
      '5. Vérifier : Adresse de livraison visible',
      '6. Vérifier : Liste des plats commandés avec quantités',
      '7. Vérifier : Montant total correct (avec frais de livraison)',
      '8. Vérifier : Méthode de paiement affichée ("Paiement à la Livraison" ou "Mobile Money")'
    ]
  },
  {
    id: 'DELIV-04',
    category: 'DeliveryWorkflow',
    name: 'Filtres et recherche dans le dashboard livraisons',
    description: 'Vérifier que les filtres fonctionnent correctement.',
    expectedBehavior: 'Filtrer par statut ne montre que les commandes concernées. La recherche trouve une commande par nom.',
    steps: [
      '1. [ADMIN] Aller dans Livraisons',
      '2. Cliquer sur le filtre "En attente" — vérifier que seules les commandes en attente s\'affichent',
      '3. Cliquer sur "Confirmée" — vérifier',
      '4. Taper un nom de client dans la recherche — vérifier que la commande apparaît',
      '5. Taper un nom inexistant — vérifier que "Aucune commande trouvée" s\'affiche',
      '6. Cliquer "Tout" pour réinitialiser les filtres'
    ]
  },

  // ============================================================
  // CATEGORY: AdminNotifications — Alertes et sons
  // ============================================================
  {
    id: 'NOTIF-01',
    category: 'AdminNotifications',
    name: 'Sonnerie nouvelle commande',
    description: 'Vérifier que la sonnerie d\'alerte se déclenche quand une nouvelle commande arrive.',
    expectedBehavior: 'Sonnerie "alert_bell" joue 2 fois (La-Ré-Mi) quand une nouvelle commande est passée.',
    steps: [
      '1. [ADMIN] Ouvrir le dashboard (s\'assurer que le son est activé dans le navigateur)',
      '2. [CLIENT] Passer une commande de livraison depuis un autre appareil',
      '3. [ADMIN] Vérifier que la sonnerie retentit immédiatement',
      '4. Vérifier que la sonnerie joue bien 2 fois de suite',
      '5. Vérifier que la bannière rouge "Nouvelle commande en attente" apparaît en haut'
    ]
  },
  {
    id: 'NOTIF-02',
    category: 'AdminNotifications',
    name: 'Annonce vocale après sonnerie',
    description: 'Vérifier que la voix annonce "Vous avez une nouvelle commande en attente" après les sonneries.',
    expectedBehavior: 'Environ 2-3 secondes après la sonnerie, une voix dit le message en français.',
    steps: [
      '1. [CLIENT] Passer une commande depuis un autre appareil',
      '2. [ADMIN] Écouter : 2 sonneries → puis voix "Vous avez une nouvelle commande en attente"',
      '3. Vérifier que la voix est en français',
      '4. Si la voix ne fonctionne pas : aller dans Paramètres → Sons → vérifier que "Voix admin" est activée'
    ]
  },
  {
    id: 'NOTIF-03',
    category: 'AdminNotifications',
    name: 'Répétition de l\'alerte toutes les 30 secondes',
    description: 'Vérifier que la sonnerie se répète si personne ne valide la commande.',
    expectedBehavior: 'La sonnerie + voix se répètent toutes les 30 secondes tant que la commande n\'est pas validée.',
    steps: [
      '1. [CLIENT] Passer une commande',
      '2. [ADMIN] NE PAS cliquer sur "Voir les commandes" ni valider',
      '3. Attendre 30 secondes — vérifier que la sonnerie rejoue',
      '4. Attendre encore 30 secondes — vérifier que ça rejoue à nouveau',
      '5. [ADMIN] Cliquer "Voir les commandes" dans la bannière — vérifier que l\'alerte s\'arrête'
    ]
  },
  {
    id: 'NOTIF-04',
    category: 'AdminNotifications',
    name: 'Bannière d\'alerte persistante',
    description: 'Vérifier que la bannière rouge reste visible sur toutes les pages admin.',
    expectedBehavior: 'Même si l\'admin navigue vers Paramètres ou Réservations, la bannière reste présente.',
    steps: [
      '1. [CLIENT] Passer une commande sans la valider',
      '2. [ADMIN] Vérifier que la bannière rouge apparaît sous la barre de navigation',
      '3. [ADMIN] Naviguer vers Paramètres — vérifier que la bannière est toujours là',
      '4. [ADMIN] Naviguer vers Réservations — vérifier que la bannière est toujours là',
      '5. [ADMIN] Cliquer X sur la bannière — vérifier qu\'elle disparaît et que le son s\'arrête'
    ]
  },
  {
    id: 'NOTIF-05',
    category: 'AdminNotifications',
    name: 'Personnalisation du son dans les paramètres',
    description: 'Vérifier que le changement de son dans Paramètres → Sons est effectif.',
    expectedBehavior: 'Changer le type de son et cliquer Tester joue le nouveau son.',
    steps: [
      '1. [ADMIN] Aller dans Paramètres → Sons',
      '2. Changer le son de notification de "Sonnerie Alerte" à "Carillon"',
      '3. Cliquer le bouton "Tester" — vérifier que le carillon joue',
      '4. Cliquer Sauvegarder',
      '5. [CLIENT] Passer une commande — vérifier que le nouveau son joue'
    ]
  },

  // ============================================================
  // CATEGORY: AutoProgression — Flux automatique
  // ============================================================
  {
    id: 'AUTO-01',
    category: 'AutoProgression',
    name: 'Progression automatique — pending → confirmed',
    description: 'Vérifier que le système confirme automatiquement une commande après le délai configuré.',
    expectedBehavior: 'Après 3 minutes (délai par défaut) sans action admin, la commande passe à "Confirmée".',
    steps: [
      '1. [ADMIN] Aller dans Paramètres → Flux Auto — noter le délai "En attente → Confirmée" (défaut: 3 min)',
      '2. [CLIENT] Passer une commande',
      '3. [ADMIN] NE PAS cliquer — attendre le délai configuré + 1 minute',
      '4. [ADMIN] Vérifier que la commande est passée automatiquement en "Confirmée"',
      '5. Vérifier que le statut côté client a aussi changé'
    ]
  },
  {
    id: 'AUTO-02',
    category: 'AutoProgression',
    name: 'Progression manuelle override — annule le timer',
    description: 'Vérifier que valider manuellement avant le délai fonctionne et repart de zéro.',
    expectedBehavior: 'L\'admin clique avant le délai → avancement immédiat. Le timer suivant repart de 0.',
    steps: [
      '1. [CLIENT] Passer une commande (statut: En attente)',
      '2. [ADMIN] Dans les 3 premières minutes, cliquer manuellement "Confirmer"',
      '3. Vérifier que le statut passe immédiatement à "Confirmée" sans attendre',
      '4. Attendre 2 minutes (délai confirmed→preparing)',
      '5. Vérifier que la commande passe en "En préparation" après ce délai'
    ]
  },
  {
    id: 'AUTO-03',
    category: 'AutoProgression',
    name: 'Délai préparation basé sur les plats',
    description: 'Vérifier que le délai "En préparation → Prête" respecte le temps du plat le plus long.',
    expectedBehavior: 'Si un plat a 45 min de préparation, la commande ne passe pas en "Prête" avant 45 min.',
    steps: [
      '1. [ADMIN] Vérifier qu\'un plat du menu a un "Temps (min)" renseigné (ex: 45 min)',
      '2. [CLIENT] Commander ce plat',
      '3. [ADMIN] Faire passer la commande à "En préparation" (manuellement ou attendre)',
      '4. Attendre le délai fixe (ex: 30 min du paramètre) → vérifier que la commande NE passe PAS en "Prête"',
      '5. Attendre jusqu\'à 45 min → vérifier que la commande passe automatiquement en "Prête"'
    ]
  },
  {
    id: 'AUTO-04',
    category: 'AutoProgression',
    name: 'Désactivation du flux automatique',
    description: 'Vérifier que désactiver le toggle stoppe toute progression automatique.',
    expectedBehavior: 'Après désactivation dans Paramètres → Flux Auto, aucune commande n\'avance sans action manuelle.',
    steps: [
      '1. [ADMIN] Aller dans Paramètres → Flux Auto',
      '2. Désactiver le toggle "Progression automatique"',
      '3. [CLIENT] Passer une commande',
      '4. Attendre plus de 5 minutes sans toucher',
      '5. Vérifier que la commande est toujours en "En attente" — AUCUN avancement automatique',
      '6. Réactiver le toggle pour revenir en mode normal'
    ]
  },
  {
    id: 'AUTO-05',
    category: 'AutoProgression',
    name: 'Mode serveur actif (pg_cron)',
    description: 'Vérifier que la progression fonctionne même quand le dashboard est fermé.',
    expectedBehavior: 'Après fermeture du dashboard, une commande en attente avance quand même selon les délais.',
    steps: [
      '1. [ADMIN] Vérifier dans Paramètres → Flux Auto que le bandeau est VERT (mode serveur)',
      '2. [CLIENT] Passer une commande',
      '3. [ADMIN] FERMER complètement le navigateur/dashboard',
      '4. Attendre le délai configuré + 2 minutes',
      '5. [ADMIN] Rouvrir le dashboard — vérifier que la commande a avancé automatiquement'
    ]
  },

  // ============================================================
  // CATEGORY: PaymentValidation — Paiements
  // ============================================================
  {
    id: 'PAY-01',
    category: 'PaymentValidation',
    name: 'Paiement à la livraison — affichage correct',
    description: 'Vérifier que le mode "Paiement à la Livraison" s\'affiche bien (pas "Paiement à la Table").',
    expectedBehavior: 'Dans le détail commande, la méthode de paiement affiche "Paiement à la Livraison".',
    steps: [
      '1. [CLIENT] Passer une commande avec paiement "Cash on Delivery"',
      '2. [ADMIN] Ouvrir le détail de la commande',
      '3. Vérifier que la méthode de paiement affiche bien "Paiement à la Livraison"',
      '4. Vérifier que le statut paiement affiche "Non payé"'
    ]
  },
  {
    id: 'PAY-02',
    category: 'PaymentValidation',
    name: 'Validation du paiement à la livraison',
    description: 'Vérifier que cliquer "Valider" dans le modal change le statut paiement.',
    expectedBehavior: 'Après validation, le statut passe de "Non payé" à "Payé" et est sauvegardé en base.',
    steps: [
      '1. [ADMIN] Ouvrir une commande avec statut paiement "Non payé"',
      '2. Cliquer sur le bouton de validation du paiement',
      '3. Vérifier que le statut passe immédiatement à "Payé" dans le modal',
      '4. Fermer et rouvrir le modal — vérifier que "Payé" est bien persisté',
      '5. Rafraîchir la page — vérifier que le changement est toujours là'
    ]
  },
  {
    id: 'PAY-03',
    category: 'PaymentValidation',
    name: 'Paiement Mobile Money — soumission preuve',
    description: 'Vérifier le flux complet de paiement Mobile Money avec upload de preuve.',
    expectedBehavior: 'Le client peut uploader une capture d\'écran. L\'admin voit la preuve dans le détail commande.',
    steps: [
      '1. [CLIENT] Passer une commande avec paiement "Mobile Money"',
      '2. [CLIENT] Sur la page de paiement, entrer le numéro de transaction et uploader une capture d\'écran',
      '3. [CLIENT] Soumettre',
      '4. [ADMIN] Aller dans Paiements Mobiles → vérifier que la soumission apparaît',
      '5. [ADMIN] Cliquer "Approuver" — vérifier que le statut passe à "Approuvé"'
    ]
  },

  // ============================================================
  // CATEGORY: DeviceTesting — Tests sur appareils réels
  // ============================================================
  {
    id: 'DEV-01',
    category: 'DeviceTesting',
    name: 'Installation PWA sur tablette',
    description: 'Vérifier que l\'app peut s\'installer comme une app native sur la tablette admin.',
    expectedBehavior: 'L\'icône apparaît sur l\'écran d\'accueil, l\'app s\'ouvre en plein écran sans barre navigateur.',
    steps: [
      '1. Sur la tablette, ouvrir Chrome ou Safari',
      '2. Naviguer vers ladesiradeplus.com',
      '3. Chrome Android: Menu ⋮ → "Ajouter à l\'écran d\'accueil"',
      '4. Safari iOS/iPadOS: Bouton Partager → "Sur l\'écran d\'accueil"',
      '5. Ouvrir l\'app depuis l\'icône — vérifier qu\'elle s\'ouvre sans barre URL',
      '6. Se connecter avec le compte admin'
    ]
  },
  {
    id: 'DEV-02',
    category: 'DeviceTesting',
    name: 'Son sur tablette — volume et déclenchement',
    description: 'Vérifier que la sonnerie de nouvelle commande est audible sur la tablette.',
    expectedBehavior: 'La sonnerie joue fort et clairement sur la tablette quand une commande arrive.',
    steps: [
      '1. Sur la tablette, ouvrir le dashboard admin',
      '2. Monter le volume de la tablette au maximum',
      '3. [CLIENT] Passer une commande depuis un autre appareil',
      '4. Vérifier que la sonnerie est audible sur la tablette',
      '5. Vérifier que la voix "Vous avez une nouvelle commande en attente" est claire',
      '6. Si pas de son : vérifier que le navigateur a la permission audio (pas en mode silencieux)'
    ]
  },
  {
    id: 'DEV-03',
    category: 'DeviceTesting',
    name: 'Dashboard admin — affichage tablette',
    description: 'Vérifier que le dashboard s\'affiche correctement sur l\'écran de la tablette.',
    expectedBehavior: 'Tous les éléments sont lisibles, les boutons sont cliquables, rien ne déborde.',
    steps: [
      '1. Sur la tablette, ouvrir le dashboard Livraisons',
      '2. Vérifier que le tableau des commandes est lisible',
      '3. Vérifier que les boutons de statut sont assez grands pour être cliqués avec le doigt',
      '4. Ouvrir le détail d\'une commande — vérifier l\'affichage du modal',
      '5. Tester en mode portrait ET en mode paysage',
      '6. Vérifier que la bannière d\'alerte rouge est visible en haut'
    ]
  },
  {
    id: 'DEV-04',
    category: 'DeviceTesting',
    name: 'Démarrage automatique au démarrage de la tablette',
    description: 'Vérifier que l\'app peut être configurée pour démarrer automatiquement.',
    expectedBehavior: 'Après redémarrage de la tablette, le dashboard est accessible rapidement sans manipulation.',
    steps: [
      '1. Installer l\'app en PWA sur la tablette (voir DEV-01)',
      '2. Sur Android : Paramètres → Apps → Chrome/App → Autoriser le démarrage automatique',
      '3. Redémarrer la tablette',
      '4. Vérifier que l\'app est accessible rapidement',
      '5. Alternative : configurer un raccourci dans la barre des tâches de la tablette'
    ]
  },
  {
    id: 'DEV-05',
    category: 'DeviceTesting',
    name: 'Connexion Wi-Fi instable — comportement',
    description: 'Vérifier que l\'app gère correctement une coupure de connexion temporaire.',
    expectedBehavior: 'Un indicateur de connexion s\'affiche en rouge. Quand le Wi-Fi revient, l\'app se reconnecte.',
    steps: [
      '1. Ouvrir le dashboard sur la tablette',
      '2. Couper le Wi-Fi de la tablette pendant 30 secondes',
      '3. Vérifier qu\'un indicateur "Déconnecté" ou rouge apparaît dans le dashboard',
      '4. Rétablir le Wi-Fi',
      '5. Vérifier que l\'indicateur repasse en "Connecté" sans recharger la page',
      '6. [CLIENT] Passer une commande — vérifier qu\'elle apparaît bien sur la tablette'
    ]
  }
];