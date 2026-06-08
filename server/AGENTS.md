# Server Agent Guidelines - Mjolnir Backend

## Core Architecture: Three-Tier Separation

**Strict Layer Boundaries**:
- **Controller**: Handles HTTP requests/responses. Calls Service layer ONLY.
- **Service**: Business logic (Inheritance, Migration). Calls DAL layer ONLY.
- **DAL (Data Access Layer)**: Only layer that imports Mongoose models. Handles persistence.

## Technical Standards

- **ESM**: Node ECMAScript Modules (`"type": "module"`). 
- **Imports**: All local relative imports MUST include the `.js` extension.
- **TypeScript**: Use `type` for definitions. Models must extend Mongoose `Document`.
- **Error Handling**: Controllers catch/translate errors. Services throw descriptive errors. Global handler for 500s.

## Domain Logic & Protocols

- **Status Inheritance**:
  - Managed in `StatusService`.
  - Triggered by UserStory status updates.
  - Prevents infinite loops by comparing `oldStatus` vs `newStatus`.
- **Sprint Migration**:
  - Hourly job (`setInterval` in `index.ts`).
  - Moves incomplete stories from expired sprints to the next available sprint.
- **Auth Middleware**:
  - Validates JWT from Bearer token.
  - Rejects if `isApproved !== true` (403 Forbidden).

## Testing & Validation

- **E2E Coverage**: Every route requires test coverage (Jest + Supertest).
- **Triggers**: Tests must verify side-effects (e.g., updating a story updates the parent Feature).
- **Pre-check**: `npm test` must pass 100% before any PR/Commit.

## No-Go Patterns

- ❌ Controller importing Models or DAL directly.
- ❌ Service performing DB operations (e.g., `Model.find()`).
- ❌ DAL performing business logic.
- ❌ Routes without auth middleware.
- ❌ No test coverage for new endpoints.
