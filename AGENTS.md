🔨 Project: Mjolnir
Core Philosophy: A minimalist, high-integrity Scrumban tool. Performance over flashiness. Decoupled architecture.

1. Architectural Constraints
- No Cloud Lock-in: Use standard Node/Express, MongoDB (Mongoose), and React.
- State Management: Use standard React hooks and context. No WebSockets.
- Sync Logic: 5-second setInterval polling for data refresh.
- UI Library: Tailwind CSS. Minimalist "Trello" vibe.
- Auth: Google OAuth. JWT stored in Cookies.

2. Strict Data Hierarchy
Every agent must respect this hierarchy and its associated logic:
Epic (Grandparent) -> Feature (Parent) -> User Story (Child)

The "Status Inheritance" Protocol:
- Activation: IF UserStory.status -> 'In Progress', SET parent Feature AND grandparent Epic to 'In Progress'.
- Completion: IF ALL UserStories in a Feature are 'Done', SET Feature to 'Done'.
- Status Set: User Stories use: 'To Do', 'In Progress', 'Blocked', 'Waiting for MR', 'Done'.
- No Cascading Deletion/Completion: Moving an Epic to 'Done' does NOT modify child statuses.

3. Core Domain Logic
- Story Points: Mandatory field on UserStory.
- Sprint Migration: Hourly backend service moves incomplete stories from expired sprints to the next chronological sprint or backlog.
- WIP Warnings (Kanban):
    - 'In Progress' limit: 1 per user (Red Glow/Border).
    - 'Waiting for MR' limit: 1 per user (Yellow Glow/Border).

4. Auth & Security
- Gatekeeper: Every user has an `isApproved` flag.
- Middleware: All protected API routes must verify `isApproved === true`.
- Bootstrap: The first registered user is auto-set as Admin and Approved.

5. Project Structure
- Root: Configuration and orchestration.
- /client: React (Vite) frontend. See client/AGENTS.md for UI standards.
- /server: Node/Express backend. See server/AGENTS.md for architectural layers.
