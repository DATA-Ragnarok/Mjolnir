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
Tab 1 (Epics): List view with progress bars (calculated by summing child story points).

Tab 2 (Features): Grouped by Epic.

Tab 3 (Sprints): Two-pane layout. Left: Backlog (Stories with sprintId: null). Right: Kanban Board (Stories for the active sprintId).

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