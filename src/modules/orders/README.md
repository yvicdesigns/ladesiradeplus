# Orders Module

A self-contained module for handling all order-related functionalities (creation, tracking, history, admin management).

## Structure
- `/types`: Contains JSDoc type definitions for standardizing data shapes across the app.
- `/constants`: Enums for statuses, order types, and standardized error dictionaries.
- `/services`: The pure API interaction layer using Supabase RPCs and queries.
- `/hooks`: React hooks wrapping the services for easy UI integration and real-time state.
- `/components`: Reusable UI components (Form, List, Tracking, Badges).
- `/pages`: Full pages for Client and Admin views.

## Examples

### Creating an Order