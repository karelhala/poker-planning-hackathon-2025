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
- ✅ **Room-Based Collaboration** - Create or join isolated planning sessions
  - Create new room with unique ID
  - Join existing room by ID
  - Share room link with one click
  - URL-based room joining (direct links work)
  - Leave room anytime
  - **Automatic state sync** when joining existing rooms
  - **Presence tracking** - See all active users in real-time
  - **Room creator identification** with star badge
  - **User avatars** with tooltips showing names and roles
- ✅ **User Identity System** - Automatic UUID generation for each user
  - Unique user ID generated on first visit
  - Persisted in localStorage across sessions
  - Displayed in user configuration modal
  - Optional username field (supports single or multiple words)
- ✅ **JIRA Integration** - Full integration with Atlassian Jira
  - Load real tickets from your Jira backlog
  - Configure Jira domain, email, and API token
  - Avatar icon with green check indicator when connected
  - Secure credentials stored in localStorage
  - Automatic ticket refresh
  - Falls back to mock tickets when not configured
  - Global user context provider for app-wide access
  - Easy credential management (save/remove)
- ✅ **Real-time collaboration** - All users in the same room see updates instantly
- ✅ **Collapsible Sidebar Navigation** - Clean, responsive layout
- ✅ WebSocket event broadcasting with Supabase Realtime
- ✅ Synchronized state across all connected clients in the room
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

1. **User A** (John Doe - UUID: abc-123...) creates room `A1B2C3D4`
2. **User B** joins the same room using the room link
3. **User A** clicks "Count" → increments to 5
4. Event broadcasts via WebSocket to room channel including user identity:
   ```json
   {
     "count": 5,
     "action": "increment",
     "userId": "abc-123...",
     "userName": "John Doe",
     "timestamp": "2025-12-01T10:30:00Z"
   }
   ```
5. **User B** sees:
   - Count updates to 5 instantly
   - Notification: "**John Doe** incremented count to 5"
6. When **User B** clicks "Reset" → everyone in the room sees count = 0
   - Notification shows which user triggered the reset

All events flow through room-specific channels (`poker-planning-room-A1B2C3D4`) with instant synchronization and user identification.

### Room Isolation:

- Each room has its own WebSocket channel
- Events only broadcast to users in the same room
- Users in different rooms don't affect each other
- Room state is ephemeral (resets when all users leave)

### State Synchronization:

When a new user joins a room with existing users:

1. **New user joins** room `A1B2C3D4`
2. **Existing users detect** the new presence
3. **One existing user sends** current state:
   ```json
   {
     "event": "state_sync",
     "payload": {
       "count": 5,
       "roomCreator": "abc-123...",
       "activeUsers": [...],
       "userId": "sender-id",
       "userName": "John Doe",
       "timestamp": "2025-12-01T10:30:00Z"
     }
   }
   ```
4. **New user receives** state and updates their view
5. **Notification**: "Synced with room. Current count: 5"

### Presence Tracking:

- **Real-time user list** - See all active users with avatars
- **Room creator badge** - Gold border and star icon
- **Current user highlight** - Blue avatar for yourself
- **User tooltips** - Hover to see full name, UUID, and role
- **Live updates** - User list updates as people join/leave
- **AvatarGroup** - Shows up to 4 users, "+N" for more

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
│   ├── UserModal.tsx           # User configuration (name, UUID, JIRA token)
│   ├── RoomControls.tsx        # Create/join/share room controls
│   ├── JoinRoomModal.tsx       # Modal to join room by ID
│   ├── CollaborationControls.tsx # Real-time counter controls
│   └── NotificationSnackbar.tsx  # Toast notifications
├── contexts/                    # React Context providers
│   ├── UserContext.tsx         # User ID (UUID) & JIRA token management
│   └── RoomContext.tsx         # Room management & URL routing
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

## Room-Based Collaboration

### Creating and Joining Rooms:

1. **Create a New Room:**
   - Click "Create Room" button
   - A unique 8-character room ID is generated (e.g., `A1B2C3D4`)
   - URL updates to `/room/A1B2C3D4`
   - You're now in the room and can start collaborating

2. **Join an Existing Room:**
   - Click "Join Room" button
   - Enter the room ID in the modal
   - Click "Join Room" to enter

3. **Share a Room:**
   - Click the share icon (📤) next to the room ID
   - Full URL is copied to clipboard
   - Share the link with others: `https://your-site.com/room/A1B2C3D4`

4. **Direct Room Access:**
   - Anyone with the room URL can join directly
   - Open `https://your-site.com/room/A1B2C3D4` → automatically joins room A1B2C3D4

5. **Leave a Room:**
   - Click the exit icon (→) to leave
   - Returns to home view with create/join options

### Testing Real-time Collaboration:

1. **Create a room** in one browser window
2. **Copy the room link** (click share icon)
3. **Open the link** in another browser window/tab
4. **Click buttons** in either window - both see updates instantly!
5. Both users are in the same room with synchronized state

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
4. **Configure JIRA integration** (optional):
   - **JIRA Domain**: Your Atlassian domain (e.g., `your-company.atlassian.net`)
   - **JIRA Email**: The email associated with your Jira account
   - **JIRA API Token**: Generate from [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
5. Click "Save Settings"
6. A **green check mark** will appear on the avatar when JIRA is connected
7. The **Backlog sidebar** will automatically load your Jira tickets

### Using JQL Queries:

1. Once Jira is configured, the sidebar shows a **JQL Query input field**
2. **Enter your custom JQL query** or use one of the presets:
   - Click the **⋮ (More)** button to see JQL preset options
   - Select a preset to automatically load those tickets
3. **Click "Load"** to fetch tickets matching your JQL query
4. Your JQL query is **saved automatically** for next time
5. Examples:
   - `project = MYPROJ AND status = "To Do"` - All To Do items in MYPROJ
   - `assignee = currentUser() AND status != Done` - Your unfinished work
   - `sprint in openSprints() order by rank` - Current sprint backlog

### Using in Your Code:

The user context is available throughout the app via the `useUser()` hook:

```typescript
import { useUser } from './contexts/UserContext'

function MyComponent() {
  const { 
    userId, 
    userName, 
    setUserName, 
    jiraToken, 
    jiraDomain,
    jiraEmail,
    hasJiraToken, 
    setJiraToken,
    setJiraDomain,
    setJiraEmail
  } = useUser()
  
  console.log('User ID:', userId) // e.g., "a3f2b1c4-..."
  console.log('User Name:', userName) // e.g., "John Doe" or null
  
  // Display personalized greeting
  const greeting = userName ? `Hello, ${userName}!` : `Hello, User!`
  
  // Use Jira credentials for API calls
  if (hasJiraToken) {
    // Make JIRA API requests with domain, email, and token
    // Load tickets, track events, etc.
  }
}
```

### Storage:

- **User ID** stored in localStorage as `userId` (auto-generated, permanent)
- **Username** stored in localStorage as `userName` (optional, user-provided)
- **JIRA credentials** stored in localStorage (optional):
  - `jiraDomain` - Your Atlassian domain
  - `jiraEmail` - Your Jira account email
  - `jiraToken` - Your Jira API token
- All data persists across browser sessions
- Settings can be cleared at any time via the modal
- The entire app has access via the `UserProvider` context

### Deploying the Jira Proxy Function:

The app requires a Supabase Edge Function to proxy requests to Jira (to handle CORS and authentication). To deploy:

1. **Via Supabase Dashboard** (Recommended):
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard) → Edge Functions
   - Create a new function named `jira-proxy`
   - Copy the code from `supabase/functions/jira-proxy/index.ts`
   - **Important:** Disable JWT verification for this function (Settings → Verify JWT: OFF)
   - Deploy the function

2. **Via Supabase CLI** (Alternative):
   ```bash
   npx supabase login --token YOUR_ACCESS_TOKEN
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase functions deploy jira-proxy
   ```
   Then disable JWT verification in the dashboard.

### JIRA Ticket Loading:

Once configured, the Backlog sidebar will:
- Automatically fetch tickets from your Jira instance using JQL (Jira Query Language)
- Customize which tickets to load with custom JQL queries
- Choose from preset JQL queries:
  - Recent Issues
  - My Open Issues
  - Sprint Backlog
  - To Do
  - In Progress
  - High Priority
- Display tickets in a clean, selectable list
- Show ticket key, summary, and external link
- JQL query is saved in localStorage for persistence
- Load/refresh tickets on demand
- Fall back to mock tickets if not configured or on error

**Example JQL Queries:**
```jql
# Get all issues in a specific project
project = MYPROJECT order by created DESC

# Get your assigned issues that are in progress
assignee = currentUser() AND status = "In Progress"

# Get high-priority issues from the current sprint
sprint in openSprints() AND priority in (Highest, High)

# Get issues from specific epic
"Epic Link" = PROJ-123 order by rank
```

## License

MIT
