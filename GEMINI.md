# Shuttle V3

## Project Overview

Shuttle V3 is a sophisticated web proxy application designed to provide secure, uncensored internet access. It utilizes a Node.js backend with Express to serve a frontend interface that allows users to browse the web through various proxy backends, specifically Ultraviolet and Dynamic.

**Key Features:**
-   **Multiple Proxy Engines:** Integrates `@titaniumnetwork-dev/ultraviolet` and `@nebula-services/dynamic` for robust proxy capabilities.
-   **Stealth Routing:** Uses educational URL paths (e.g., `/math` for games, `/physics` for apps) to disguise activity.
-   **Bare Server:** Implements `@tomphttp/bare-server-node` to handle WebSocket and HTTP proxying traffic efficiently.
-   **Customizable UI:** Uses EJS templates for server-side rendering, allowing for easy theming and layout management.

## Building and Running

### Prerequisites
-   **Node.js:** Version 18.0.0 or higher is required.

### Development
1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Development Server:**
    ```bash
    npm start
    ```
    The server will start on port `8080` (or the port defined in the `PORT` environment variable).

### Production
For production environments, the application is configured to use PM2 for process management.

1.  **Start with PM2:**
    ```bash
    npm run prod
    ```
    This uses `ecosystem.config.cjs` to manage the application process.

2.  **Other PM2 Commands:**
    -   `npm run stop`: Stop the server.
    -   `npm run restart`: Restart the server.
    -   `npm run logs`: View server logs.

## Design Constraints

-   **Onboarding Arrow Position:** The following CSS values for `.onboarding-arrow-container` in `public/assets/css/style.css` must NEVER be changed, as they are precisely tuned for the UI:
    ```css
    .onboarding-arrow-container {
      position: absolute;
      top: 24px;
      left: 70px;
      width: 60px;
      height: 60px;
    }
    ```

## Development Conventions

### Code Structure
-   **Entry Point:** `index.js` handles the server setup, Express configuration, and the Bare server integration.
-   **Templates (`views/`):**
    -   `layout.ejs`: The main wrapper template containing navigation and common resources.
    -   Individual pages (`index.ejs`, `games.ejs`, `apps.ejs`, `settings.ejs`) are rendered within the layout.
-   **Static Assets (`public/`):**
    -   `assets/`: Contains `css/` and `js/` subdirectories for frontend logic and styling.
    -   Proxy scripts (`uv.sw-handler.js`, `dynamic.sw-handler.js`) reside in the root of `public/` or their respective folders to handle service worker registration.

### Routing Logic
Routes are defined in `index.js` and mapped to EJS templates. Note the stealth naming convention:
-   `/` -> `index` (Home)
-   `/math` -> `games` (Games)
-   `/physics` -> `apps` (Apps)
-   `/settings` -> `settings` (Settings)

### Proxy Integration
The application mounts the Bare server directly onto the HTTP server instance. Request handling logic in `index.js` determines whether a request should be routed to the Bare server (proxy traffic) or the Express app (UI traffic):

```javascript
httpServer.on('request', (req, res) => {
  if (bare.shouldRoute(req)) bare.routeRequest(req, res)
  else app(req, res)
})
```
