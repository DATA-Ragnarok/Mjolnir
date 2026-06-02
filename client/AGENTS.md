# Client Agent Guidelines - Mjolnir Frontend

## Component Architecture

**Folder Structure**:
- `components/`: Reusable UI building blocks (buttons, modals, cards). No API calls directly. Props-driven.
- `pages/`: Full-screen views. Three main tabs:
  - **Epics Tab**: List with progress bars. Progress = (sum of "Done" story points) / (total story points).
  - **Features Tab**: Grouped by Epic. Show status, story count.
  - **Sprints Tab**: Two-pane layout. Left = Backlog (sprintId: null). Right = Kanban board (active sprint, grouped by status columns: "To Do", "In Progress", "Done").
- `services/`: API client (api.ts), auth logic (authService.ts). Centralize all server calls.
- `store/`: Context providers only (AuthContext). No Redux, Zustand, or other state libraries.
- `types/`: Mirror backend Mongoose models as TypeScript types.
- `hooks/`: Custom React hooks (useAuth, useEpics, useFeatures, etc.).

## TypeScript & Type Conventions

- Prefer `type` for type definitions; use `interface` for component props and extendable object shapes where appropriate.
- No "I" prefix. Correct: `User`, `Epic`, `Feature`. Incorrect: `IUser`, `IEpic`.
- Mirror backend models as plain TypeScript types in `types/`. Do not import Mongoose models or server types into client.
- **No `any` types**. Use strict mode in tsconfig.json.

## Data Polling (5-Second Sync)

Client fetches fresh data every 5 seconds using `setInterval` function.

**Rules**:
- Always clear interval in cleanup function (prevent memory leaks).
- Debounce user actions (drag, edit): Update local state immediately, delay API call 500–1000ms to avoid excessive requests.
- On API error, show toast; maintain previous state.

## State Management: AuthContext Only

Use React Context API for global auth state (found in ./src/store/authContext.ts).

**Rules**:
- Store token in localStorage. Verify on app mount.
- If `isApproved === false`, show approval-pending message (do not render app).
- For local component state, use `useState`. For global cross-component data, consider additional Contexts if needed (but prefer polling).

## Modal System

Implement a singleton modal shell using `ModalProvider` and `useModal`.
- Only one modal shell is rendered at a time.
- Support a navigation stack with push/pop semantics.
- Opening a child item from within a modal must push the child view onto the stack.
- Automatically show a Back button when stack length > 1.
- Use the same shell for `EpicModalContent`, `FeatureModalContent`, and `UserStoryModalContent`.

## API Service (axios + JWT Interceptor)

Centralize all server calls in `services/api.ts`. Attach JWT token from localStorage in request interceptor. Group endpoints by resource (epicAPI, featureAPI, userStoryAPI). Handle errors: redirect on 401, show permission error on 403, generic toast on 5xx.

## Drag & Drop with dnd-kit

Use `@dnd-kit` for vertical (backlog sorting) and horizontal (status column) drag-drop.

**Kanban Board**:
- Five columns: `To Do`, `In Progress`, `Blocked`, `Waiting for MR`, `Done`.
- Drag stories between columns to update `status`.
- Drag stories left/right to reorder within the same column.

**Backlog View**:
- Vertical list of cards.
- First card is Product Backlog (`sprintId === null`).
- Remaining cards are sprint buckets ordered by `endDate` descending.
- Each card lists its assigned user stories.

**Rules**:
- After drop, immediately update local state.
- Debounce (500ms) API call to `PUT /user-stories/:id`.
- Provide visual feedback (dragging opacity, drop zone highlight).

## Sprints Tab Requirements

- Provide a toggle between Backlog and Kanban views.
- Default Kanban view uses the current active sprint.
- Backlog shows Product Backlog plus sprint cards.
- Kanban uses a sprint selector and five status columns.
- Clicking a story opens `UserStoryModalContent`.
- New Story and New Sprint actions open modal content.

## WIP Limits & Indicators

**In Progress Limit**: 1 per user. If violated, apply **red glow/border** to story card.

**Waiting for MR Limit**: 1 per user. If violated, apply **yellow glow/border** to story card.

Logic: On story update, check count of user's stories in the target status. If count > 1, add visual indicator and show warning toast.

## Tailwind Styling

Tailwind utilities only. No custom CSS. Minimalist "Trello" aesthetic. Keep design clean and sparse.

## Authentication Flow

1. User clicks "Login with Google".
2. Google OAuth redirect; exchange code for JWT.
3. Store token in localStorage.
4. Fetch user profile; check `isApproved`.
5. If `isApproved === false`, display approval-pending page (block app access).
6. If `isApproved === true`, render main app.
7. On logout, clear localStorage and redirect to login page.

## Testing

Unit test components (rendering, interactions). E2E test full workflows. Mock API calls in tests.

## No-Go Patterns

1. ❌ Direct API calls in components. Use custom hooks or props.
2. ❌ Redux, Zustand, or external state libraries. Use Context + hooks.
3. ❌ WebSockets or real-time listeners. Use polling only.
4. ❌ Material-UI, Chakra, or other component libraries. Tailwind only.
5. ❌ Importing Mongoose models or server DAL into client code.
6. ❌ Unhandled promise rejections. Always `.catch()` or try/catch.
7. ❌ Memory leaks: Clear intervals, timeouts in useEffect cleanup.
8. ❌ Stale closures in event handlers. Use useCallback if deps change.
9. ❌ Missing loading/error states in async operations.
10. ❌ Rendering unverified user data without sanitization.

## Quick Checklist: New Feature

- [ ] Create TypeScript type in `types/`.
- [ ] Add API service function in `services/api.ts`.
- [ ] Create component in `components/` (if reusable) or page file.
- [ ] Add polling or event handler to fetch fresh data.
- [ ] Handle loading and error states.
- [ ] Apply Tailwind styling (responsive, minimalist).
- [ ] Add unit tests.
- [ ] Verify JWT token sent in all requests.
