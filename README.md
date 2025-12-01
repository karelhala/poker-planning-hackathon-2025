# poker-planning-hackathon-2025

Poker planning project for realtime ticket sizing with Supabase integration.

## Tech Stack

- **React 18** with TypeScript
- **Material UI v5** with professional dashboard template
- **Dark/Light Mode** theme toggle
- **Webpack 5** for bundling
- **Supabase Realtime** for WebSocket events
- **GitHub Pages** for deployment
- **Component-based architecture** with custom hooks

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
- ✅ **User Identity System** - Automatic UUID generation for each user
  - Unique user ID generated on first visit
  - Persisted in localStorage across sessions
  - Displayed in user configuration modal
  - Optional username field (supports single or multiple words)
- ✅ **JIRA Integration** - Store and manage your JIRA API token
  - Avatar icon with green check indicator when token is saved
  - Secure modal for token input
  - Token stored in localStorage
  - Global user context provider for app-wide access
  - Easy token management (save/remove)
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
  - Includes: `{ count, action: 'increment', userId, userName, timestamp }`

- **`button_click_reset`**: When any user clicks the reset button
  - All users' counts are reset to 0 simultaneously
  - Includes: `{ count: 0, action: 'reset', userId, userName, timestamp }`

### Real-time Sync:

1. **User A** (John Doe - UUID: abc-123...) clicks "Count" → increments to 5
2. Event broadcasts via WebSocket including user identity:
   ```json
   {
     "count": 5,
     "action": "increment",
     "userId": "abc-123...",
     "userName": "John Doe",
     "timestamp": "2025-12-01T10:30:00Z"
   }
   ```
3. **User B, C, D** all see:
   - Count updates to 5 instantly
   - Notification: "**John Doe** incremented count to 5"
4. When **User B** clicks "Reset" → everyone's count resets to 0
   - Notification shows which user triggered the reset

All events flow through the `poker-planning-events` channel with instant synchronization and user identification.

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

## Project Structure

```
src/
├── App.tsx                      # Main app component (orchestrates everything)
├── main.tsx                     # Entry point with providers
├── components/                  # Reusable UI components
│   ├── Header.tsx              # App bar with theme toggle & avatar
│   ├── Sidebar.tsx             # Navigation drawer
│   ├── JiraTokenModal.tsx      # JIRA token & user ID configuration
│   ├── CollaborationControls.tsx # Real-time counter controls
│   └── NotificationSnackbar.tsx  # Toast notifications
├── contexts/                    # React Context providers
│   └── UserContext.tsx         # User ID (UUID) & JIRA token management
├── hooks/                       # Custom React hooks
│   ├── useThemeMode.ts         # Theme management (light/dark)
│   └── useSupabaseRealtime.ts  # WebSocket event handling
└── supabaseClient.ts           # Supabase configuration
```

### Key Design Patterns:

- **Component Composition:** Small, focused components with clear responsibilities
- **Custom Hooks:** Business logic extracted from components
- **Context API:** Global state management for user identity and JIRA tokens
- **UUID Generation:** Automatic user identification on first visit
- **Props Drilling Prevention:** Hooks and context reduce prop passing
- **Separation of Concerns:** UI, logic, and state are cleanly separated

## Testing Real-time Collaboration

To test the real-time sync:

1. Open the app in two different browser windows/tabs
2. Click the count button in one window
3. Watch the count update instantly in the other window
4. Try resetting from either window - both will reset simultaneously

You can also test with multiple users accessing the same URL!

## User Identity & JIRA Integration

The app includes automatic user identification and JIRA token management:

### User ID (UUID):

Each user automatically gets a unique identifier:
- **Generated on first visit** - UUID v4 format
- **Stored in localStorage** - `userId` key
- **Persists across sessions** - Same ID every time you visit
- **Displayed in modal** - See your user ID when configuring settings

### Setting up User Profile:

1. Click the **avatar icon** in the top-right corner (next to theme toggle)
2. View your unique user ID in the modal
3. **Enter your name** (optional) - Can be single word like "John" or multiple words like "John Doe"
4. **Enter your JIRA API token** (optional) to enable JIRA integration
5. Click "Save Settings"
6. A **green check mark** will appear on the avatar when JIRA token is active

### Using in Your Code:

The user context is available throughout the app via the `useUser()` hook:

```typescript
import { useUser } from './contexts/UserContext'

function MyComponent() {
  const { userId, userName, setUserName, jiraToken, hasJiraToken, setJiraToken } = useUser()
  
  console.log('User ID:', userId) // e.g., "a3f2b1c4-..."
  console.log('User Name:', userName) // e.g., "John Doe" or null
  
  // Display personalized greeting
  const greeting = userName ? `Hello, ${userName}!` : `Hello, User!`
  
  // Use jiraToken for API calls
  if (hasJiraToken) {
    // Make JIRA API requests with the token
    // Track events with the userId and userName
  }
}
```

### Storage:

- **User ID** stored in localStorage as `userId` (auto-generated, permanent)
- **Username** stored in localStorage as `userName` (optional, user-provided)
- **JIRA token** stored in localStorage as `jiraToken` (optional)
- All data persists across browser sessions
- Settings can be cleared at any time via the modal
- The entire app has access via the `UserProvider` context

## License

MIT
