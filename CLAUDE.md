# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shuttle is a web proxy application built with Node.js and Express. It provides users with secure, uncensored internet access through proxy services. The application integrates multiple proxy engines including Ultraviolet and Dynamic for enhanced performance and compatibility.

## Architecture

**Core Stack:**
- **Backend:** Node.js with Express framework
- **Proxy Engines:** @titaniumnetwork-dev/ultraviolet and @nebula-services/dynamic
- **Bare Server:** @tomphttp/bare-server-node for WebSocket and HTTP proxying
- **Template Engine:** EJS for server-side rendering
- **Process Management:** PM2 for production deployment

**Key Components:**
- `index.js`: Main application entry point, sets up Express server and routes
- `views/`: EJS templates for different pages (layout, index, games, apps, settings, 404)
- `public/`: Static assets including CSS, JavaScript, and proxy service workers
- `public/assets/`: Application-specific styles and scripts organized by function

**Routing Structure:**
The application uses a simple route mapping system defined in `index.js`:
- `/` → Home page (index)
- `/math` → Games page
- `/physics` → Apps page
- `/settings` → Settings page
- `/3kh0` → Special games integration page

**Proxy Integration:**
- Ultraviolet proxy served at `/uv/` endpoint
- Dynamic proxy served at `/dynamic/` endpoint
- Bare server handles proxy requests at `/bare/` endpoint
- Service workers handle client-side proxy functionality

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Production deployment with PM2
npm run prod

# View application logs
npm run logs

# Stop production server
npm run stop

# Restart production server
npm run restart
```

## Environment Configuration

**Node.js Requirements:**
- Minimum version: 18.0.0 (specified in package.json engines)

**Environment Variables:**
- `PORT`: Server port (defaults to 8080)
- `NODE_ENV`: Set to "production" for production builds

**Port Configuration:**
The server listens on `process.env.PORT || 8080` and logs the active port on startup.

## Static Asset Organization

**CSS Structure:**
- `style.css`: Main application styles
- `games.css`: Games page specific styles
- `404.css`: Error page styles
- `loader.css`: Loading animations
- `particles.css`: Background particle effects

**JavaScript Structure:**
- `index.js`: Core application functionality
- `proxy.js`: Proxy interface controls
- `home.js`: Homepage functionality
- `games.js`: Games page functionality
- `settings.js`: Settings page functionality
- Service workers: `uv.sw-handler.js`, `dynamic.sw-handler.js`

## Template System

The application uses EJS templates with a main layout system:
- `layout.ejs`: Base template with navigation, theme toggle, and common scripts
- Page-specific templates include content within the layout
- Navigation items and current path are passed as template variables
- Dynamic domain configuration for analytics and branding

## Deployment Platforms

The project is configured for deployment on multiple platforms:
- Heroku (with buildpack configuration in app.json)
- Render, Cyclic, Glitch, Azure, IBM Cloud, AWS Amplify, Google Cloud
- All platforms use `npm start` as the startup command