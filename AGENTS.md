🔨 Project: Mjolnir
Core Philosophy: A minimalist, high-integrity Scrumban tool. Performance over flashiness. Decoupled architecture.

1. Architectural Constraints
No Cloud Lock-in: Do not use Firebase, AWS Amplify, or DynamoDB. Stick to standard Node/Express, MongoDB (Mongoose), and React.

State Management: Use standard React hooks and context. Do not implement WebSockets.

Sync Logic: Use a 5-second setInterval polling mechanism to refresh data from the server.

UI Library: Tailwind CSS only. Keep the "Trello" minimalist vibe.

2. Strict Data Hierarchy
Every agent must respect this hierarchy and its associated logic:

Epic (Grandparent)

Feature (Parent - linked to 1 Epic)

User Story (Child - linked to 1 Feature and optionally 1 Sprint)

The "Status Inheritance" Protocol (Hard-Coded Logic)
Activation: IF UserStory.status changes to 'In Progress', SET parent Feature.status AND grandparent Epic.status to 'In Progress'.

Completion: IF all UserStories belonging to a Feature are 'Done', SET Feature.status to 'Done'.

No Cascading Deletion/Completion: If an Epic is moved to 'Done', do NOT modify child statuses.

3. Scrumban Mechanics
Story Points: Every UserStory must have a storyPoints field (Number).

Sprint Migration: Implement a backend service that checks the endDate of the active Sprint. If the date has passed, any UserStory where status !== 'Done' must have its sprintId updated to the next chronological Sprint ID.

WIP Warnings:

In Progress limit: 1 per user. (Trigger: Red Glow/Border).

Waiting for MR limit: 1 per user. (Trigger: Yellow Glow/Border).

4. Auth & Security
Method: Google OAuth.

Gatekeeper: Every User document has an isApproved (Boolean).

Middleware: Every API route must check for isApproved === true.

Bootstrap: The first user registered in the database should be automatically set to isApproved: true and designated as Admin.

5. UI Requirements
Universal Task Modals: Implement a global, singleton-based modal system via the `useModal` hook and `ModalProvider`. Every task-like element (Epic, Feature, User Story) must open its respective 'Content' component (e.g., `EpicModalContent`) within this shared shell. 
- Singleton Pattern: Only one modal shell exists at a time, managed via React Context.
- Navigation Stack: The modal system must support a navigation stack (push/pop). Opening a child element (e.g., a Feature from within an Epic modal) pushes it onto the stack. 
- Back Button: A "Back" button must automatically appear in the shared header when the stack has >1 item, allowing seamless return to the parent context.
- UI Consistency: The shared shell handles the backdrop, header actions (Back/Close), and a status-based progress ribbon.

Tab 1 (Epics): Separated Card List - grouped by status into collapsible sections (order: Blocked, In Progress, To Do, Done). 
- Card Details: Each card displays Title, Status (colored badge), Description (max 2 lines), Feature Count, Last Updated Date, and a Progress Bar (Story Points).
- Empty States:
    - Global: If no epics exist, show a centered `EmptyState` component with an icon, description, and "Create your first Epic" CTA.
    - Sectional: If a specific status section is empty, show a subtle "All clear" placeholder with a coffee icon.
- Interaction: Clicking a card calls `openModal(<EpicModalContent epic={epic} />)`. Creating a new epic also uses this pattern.

Tab 2 (Features): Status Board with Epic Context - grouped by status into collapsible sections (order: Blocked, In Progress, To Do, Done).
- Filtering & Context:
    - Global Epic Filter: A dropdown or pill-based selector to filter features by their parent Epic.
    - Epic Context Bar: When a single Epic is filtered, display a slim header showing the parent Epic's status and overall progress (story points).
- Card Details: Each card displays Title, Status (colored badge), Description (max 2 lines), User Story Count, Parent Epic Name (subtle tag, hidden if filtered by Epic), Last Updated Date, and a Progress Bar (Story Points).
- Empty States:
    - Global: If no features exist, show `EmptyState` with a "Create your first Feature" CTA.
    - Sectional: "All clear" placeholder for empty status sections.
- Interaction: Clicking a card calls `openModal(<FeatureModalContent feature={feature} />)`. 
- Navigation: 
    - Deep-linking from the Epics page (clicking "X Features") must auto-filter this page to the selected Epic.
    - Nested Navigation: In `EpicModalContent`, clicking a child feature must push `FeatureModalContent` onto the modal stack. In `FeatureModalContent`, the "Go to Epic" link must push the parent `EpicModalContent` onto the stack (or use the back button if it's already in the stack). 

Tab 3 (Sprints): Toggleable Backlog and Kanban View - A unified interface for planning and execution.
- View Toggle: A top-level switch to toggle between "Backlog" and "Sprint" (default) views.
- Backlog View:
    - Card List: A vertical list of wide cards.
        - First Card: "Backlog" containing all unassigned User Stories (`sprintId` is null).
        - Subsequent Cards: Sprints ordered by their `endDate` (descending).
        - Card Title: "Backlog" for the first card; "Sprint Name (Start Date - End Date)" for others.
    - Card Content: Each card displays a list of its assigned User Stories.
        - Story Details: Title, Assigned User (icon/coin), Status, and Story Points.
    - Interaction: 
        - Clicking a User Story opens the `UserStoryModal` with the ability to update and delete.
        - "Create New Sprint" button.
        - "Create New User Story" button.
- Sprint View (Kanban):
    - Sprint Selector: A dropdown to select any sprint to view. Defaults to the "Current" active sprint.
    - Kanban Board: 5 status-based columns (To Do, In Progress, Blocked, Waiting for MR, Done) filtered by the selected sprint.
    - Story Card Details:
        - Metadata: Title, Story Points, Feature Name, and Assigned User (avatar/initials).
        - WIP Glow: 
            - Red Border/Glow: If a user has >1 story in "In Progress".
            - Yellow Border/Glow: If a user has >1 story in "Waiting for MR".
- Interaction:
    - Clicking any card opens the interactive `UserStoryModal` for viewing/editing.
    - Dragging a story to "Done" triggers the "Status Inheritance" logic.
- Navigation: Direct link from Features page (clicking "X User Stories") opens the relevant view.

Drag & Drop: Use dnd-kit for vertical and horizontal sorting.

6. Coding Standards
TypeScript: Use `type` instead of `interface` for all Models and Definitions. Do not use the "I" prefix for types (e.g., use `User` instead of `IUser`). Types for all the Models should extend Mongoose `Document`. Keep right inheritance between types. No any types allowed.

Modularity: Keep Controller logic separate from Mongoose Models.

Safety: Always include error handling for the "Status Inheritance" triggers to prevent infinite loops.

Testing: every route in the server should have e2e tests that covers it's logic

7. Tooling & Environment Standards
Three-Tier Architecture: Strictly maintain separation between Controller, Service, and DAL layers.
- Controller: Handles API/HTTP logic (requests, responses, status codes). Must ONLY call the Service layer.
- Service: Handles Business Logic (e.g., Status Inheritance, Sprint Migration). Must ONLY call the DAL layer. No direct Mongoose `.save()` or model interactions.
- DAL (Data Access Layer): Handles all Data Persistence (MongoDB/Mongoose operations). This is the ONLY layer that imports Mongoose models.

TypeScript Build Isolation (Backend/Frontend): Strict separation of source code and build artifacts. `tsconfig.json` MUST enforce `"outDir": "./dist"` and `"rootDir": "./src"`. Never run `tsc` without verifying these settings to prevent polluting the `src` directory with `.js`, `.js.map`, or `.d.ts` files.

Server Module Format (ESM): The backend MUST use ECMAScript Modules. `package.json` must contain `"type": "module"`. `tsconfig.json` must set `"module": "Node16"` and `"moduleResolution": "node16"`. All local relative imports in the server must explicitly include the `.js` extension.

Frontend Tooling Consistency: When scaffolding or adding dependencies, be mindful of Node.js engine compatibility. Prefer established major versions (e.g., Vite v5, Tailwind v3) over "latest" to avoid silent failures or native binding errors on older Node.js versions.