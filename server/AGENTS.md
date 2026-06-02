# Server Agent Guidelines - Mjolnir Backend

## Core Architecture: Three-Tier Separation

**Strict Layer Boundaries** — No exceptions:
- **Controller**: HTTP handling only. Calls Service exclusively. Never import Mongoose models or DAL.
- **Service**: Business logic (Status Inheritance, Sprint Migration). Calls DAL exclusively. No direct `.save()` or model operations.
- **DAL**: Data persistence only. ONLY layer that imports Mongoose models. Returns plain objects or documents.

Enforce via imports: If a Controller imports a Model, it violates the rule.

## TypeScript & Type Conventions

- Use `type` (not `interface`) for all type definitions.
- No "I" prefix. Correct: `User`, `Epic`, `Feature`. Incorrect: `IUser`, `IEpic`.
- Models must extend Mongoose `Document`:
  ```typescript
  type UserStory = { _id: ObjectId; title: string; ... } & Document;
  ```
- **No `any` types**. Use strict mode in tsconfig.json.
- All local imports must include `.js` extension (ESM requirement):
  ```typescript
  import { UserService } from '../services/UserService.js';
  ```

## Data Hierarchy & Status Inheritance Protocol

**Hierarchy**: Epic ← Feature ← UserStory (each child links to exactly one parent)

**Status Set**: UserStory statuses include `To Do`, `In Progress`, `Blocked`, `Waiting for MR`, and `Done`.

**Activation**: UserStory status → "In Progress" triggers Feature AND Epic to "In Progress" immediately.

**Completion**: When ALL UserStories in a Feature are "Done" → Feature becomes "Done". If ALL Features in an Epic are "Done" → Epic becomes "Done".

**No Cascading Deletion**: Epic moved to "Done" does NOT change child statuses.

**Infinite Loop Prevention**: Always check `oldStatus !== newStatus` before triggering parent updates. Service must prevent redundant cascades.

## Sprint Migration Service

Automatically moves incomplete stories to the next sprint when current sprint's `endDate` passes.

- Scheduled as an hourly backend job.
- Find expired sprints, locate incomplete stories (status ≠ "Done"), move to next chronological sprint.
- If no next sprint exists, story stays in backlog (`sprintId: null`).
- Use `SprintService` hourly or as part of startup/scheduler logic to prevent stale assignments.

## Authentication & Authorization

- Every protected route uses `authMiddleware`.
- Middleware checks `Authorization: Bearer <token>`, validates JWT, verifies `isApproved === true`.
- Approved users can be fetched via `UserService.getApprovedUsers()`.
- Attaches `req.user` object: `{ _id, email, isApproved }`.
- First registered user auto-sets `isApproved: true` (bootstrap admin).
- Subsequent users start with `isApproved: false` (approval gate).

Return 401 for missing/invalid token. Return 403 for `isApproved === false`.

## Testing Requirements

**Every route must have e2e test coverage** using Jest + Supertest.

Test files live under `server/src/tests/`.

Coverage must include:
- Happy path (201/200 responses).
- Error cases (400, 401, 403, 404, 500).
- Business logic triggers (e.g., Status Inheritance updates parent).
- Auth validation (missing token, unapproved user).

Before deploying, ensure `npm test` passes 100% of route tests.

## Error Handling

- Catch errors in Controller; translate to HTTP status codes.
- Service throws descriptive errors (not HTTP responses).
- DAL handles Mongoose-specific errors (validation, not found).
- Global error handler catches uncaught exceptions; return 500 with safe message.

**Status Code Convention**:
- 200: Successful operation
- 201: Resource created
- 400: Validation error
- 401: Missing/invalid token
- 403: Insufficient permissions
- 404: Resource not found
- 500: Server error

## Environment & Build

- `package.json` must have `"type": "module"` (ESM).
- `tsconfig.json`: `"outDir": "./dist"`, `"rootDir": "./src"`.
- Run `npm run build` to compile; verify `.js` files go to `dist/`, not `src/`.
- Dev: `npm run dev` (tsx watch). Production: `npm start` (node dist/index.js).

## No-Go Patterns

1. ❌ Controller importing DAL or Model directly.
2. ❌ Service calling Model methods (e.g., `Model.save()`); must delegate to DAL.
3. ❌ DAL performing business logic (e.g., checking all stories done); must return data.
4. ❌ Missing error handling in try/catch blocks.
5. ❌ Unvalidated user input in Controllers.
6. ❌ Direct `.save()` outside DAL.
7. ❌ Status Inheritance without old/new status comparison (infinite loop risk).
8. ❌ Routes without auth middleware (unless explicitly public).
9. ❌ No test coverage for new routes.

## Quick Checklist: New Endpoint

- [ ] Create route in `routes/*.ts` with auth middleware.
- [ ] Create Controller method (HTTP only).
- [ ] Create Service method (business logic only).
- [ ] Create DAL method (if database operation).
- [ ] Define TypeScript types.
- [ ] Add e2e tests covering happy + error paths.
- [ ] Validate input in Controller.
- [ ] Handle all error cases (return correct status codes).
