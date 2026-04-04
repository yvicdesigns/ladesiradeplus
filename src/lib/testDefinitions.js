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
  'ErrorHandling'
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
  }
];