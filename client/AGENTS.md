# Client Agent Guidelines - Mjolnir Frontend

## Architecture Standards

**Folder Structure**:
- `components/`: Reusable UI blocks. Props-driven.
- `pages/`: View-level components (Epics, Features, Sprints).
- `services/`: Centralized API calls (api.ts) and auth logic.
- `store/`: Context providers (Auth, Modal).
- `hooks/`: Domain-specific hooks (useEpics, useFeatures, etc.).

## Core Requirements

- **Auth**: JWT stored in Cookies. Interceptor attaches `Authorization: Bearer <token>` to all requests.
- **Sync**: 5-second polling via `setInterval`. Always clear intervals in `useEffect` cleanup.
- **State**: React Context for global state (Auth, Modal). Local `useState` for UI-only state.
- **Modal System**: Singleton shell via `useModal`. Supports a navigation stack (push/pop) with automatic "Back" button for nested views.
- **Styling**: Tailwind CSS only. No custom CSS files.

## UI & Interactions

- **Navigation**:
  - Epics -> Features (filtered by Epic).
  - Features -> User Stories (Sprint view context).
- **Kanban Board**:
  - 5 columns: `To Do`, `In Progress`, `Blocked`, `Waiting for MR`, `Done`.
  - Drag & Drop via `@dnd-kit`. Immediate local update followed by debounced API call.
- **WIP Indicators**:
  - Red glow: >1 story 'In Progress' for a user.
  - Yellow glow: >1 story 'Waiting for MR' for a user.

## Technical Constraints

- **TypeScript**: No `any`. Mirror backend models in `types/`. 
- **No-Go**: No Redux, No WebSockets, No Material-UI/Chakra, No direct API calls in components.
- **Testing**: Unit tests for components; E2E for critical workflows.
