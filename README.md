# poker-planning-hackathon-2025

Poker planning project for realtime ticket sizing with Supabase integration.

## Tech Stack

- **React 18** with TypeScript
- **Material UI v5** with professional dashboard template
- **Dark/Light Mode** theme toggle
- **Webpack 5** for bundling
- **Supabase Realtime** for WebSocket events
- **GitHub Pages** for deployment

## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- A Supabase account and project

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/karelhala/poker-planning-hackathon-2025.git
   cd poker-planning-hackathon-2025
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   
   a. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   b. Get your Supabase credentials from [Supabase Dashboard](https://app.supabase.com/project/_/settings/api)
   
   c. Update `.env` with your values:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   ```

4. **Enable Supabase Realtime**
   
   Make sure Realtime is enabled in your Supabase project:
   - Go to your Supabase Dashboard
   - Navigate to Settings → API
   - Ensure Realtime is enabled (it's enabled by default)

## Development

Run the development server:
```bash
npm run dev
```

This will start the Webpack dev server at `http://localhost:3000`

## Build

Build for production:
```bash
npm run build
```

The output will be in the `dist/` folder with `dist/index.js` as the main entry point.

## Features

- ✅ **Professional Dashboard UI** inspired by [Material UI Dashboard Template](https://mui.com/material-ui/getting-started/templates/dashboard/)
- ✅ **Smart Theme System** - Automatically detects system dark/light mode preference
  - Respects OS-level theme settings (macOS, Windows, Linux)
  - Manual toggle available to override system preference
  - Saves your preference in localStorage
- ✅ **Real-time collaboration** - All users see the same count instantly
- ✅ **Collapsible Sidebar Navigation** - Clean, responsive layout
- ✅ WebSocket event broadcasting with Supabase Realtime
- ✅ Synchronized state across all connected clients
- ✅ Interactive dashboard cards with live statistics
- ✅ TypeScript support throughout
- ✅ Environment variable configuration
- ✅ Live notifications when other users interact
- ✅ Automatic GitHub Pages deployment

## How It Works

The app uses Supabase Realtime to synchronize state across all connected users:

### Events Broadcast:

- **`button_click_increment`**: When any user clicks the count button
  - All other users instantly see the updated count
  - Includes: `{ count, action: 'increment', timestamp }`

- **`button_click_reset`**: When any user clicks the reset button
  - All users' counts are reset to 0 simultaneously
  - Includes: `{ count: 0, action: 'reset', timestamp }`

### Real-time Sync:

1. User A clicks "Count" → increments to 5
2. Event broadcasts via WebSocket to all connected clients
3. User B, C, D all see the count update to 5 instantly
4. When User B clicks "Reset" → everyone's count resets to 0

All events flow through the `poker-planning-events` channel with instant synchronization.

## GitHub Pages Deployment

The app automatically deploys to GitHub Pages when you push to the `main` branch.

### Setup GitHub Pages:

1. **Set up repository secrets** (Settings → Secrets and variables → Actions):
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_PUBLISHABLE_KEY`: Your Supabase publishable (anon) key

2. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: GitHub Actions

3. **Push to main branch** - the deployment will happen automatically

Your app will be available at: `https://karelhala.github.io/poker-planning-hackathon-2025/`

## Testing Real-time Collaboration

To test the real-time sync:

1. Open the app in two different browser windows/tabs
2. Click the count button in one window
3. Watch the count update instantly in the other window
4. Try resetting from either window - both will reset simultaneously

You can also test with multiple users accessing the same URL!

## License

MIT
