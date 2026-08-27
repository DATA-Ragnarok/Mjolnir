# `FEATURE_SPEC: AI Agent API & MCP Integration`

## 1. Objective
Enable external AI agents (via the Model Context Protocol – MCP) and CLI consoles to securely interact with the Mjolnir platform. The scope is strictly limited to **reading epics, features and user stories**, **creating new user stories** and **updating user stories status**.

## 2. Architecture Overview
```
┌──────────────────────────────┐
│  AI Client / IDE / Console   │ (Claude Desktop, Cursor, CLI)
└──────────────┬───────────────┘
               │ stdio / JSON-RPC
┌──────────────▼───────────────┐
│     Mjolnir MCP Server       │ (Lightweight Node CLI / Proxy)
└──────────────┬───────────────┘
               │ HTTPS (x-api-key: sk_live_...)
┌──────────────▼───────────────┐
│     Express REST API         │ (/agent/tasks)
└──────────────┬───────────────┘
               │
┌──────────────▼───────────────┐
│      MongoDB Database        │ (ApiKeys & User story Collections)
└──────────────────────────────┘
```

## 3. Database Layer (MongoDB / Mongoose)

### 3.1 `ApiKey` Schema
Create `src/models/ApiKey.ts` with this type:

```typescript
type ApiKey = Document & {
  name: string;
  keyHash: string;
  prefix: string; // e.g. "sk_live_1234..."
  scopes: ('read:tasks' | 'write:tasks')[];
  isActive: boolean;
  createdByUserId: mongoose.Types.ObjectId;
  lastUsedAt?: Date;
  createdAt: Date;
}
```

## 4. Backend Implementation (Express & TypeScript)

### 4.1 Authentication & Authorization Middleware
Create `src/middleware/agentAuth.ts`:
* Extract key from header `x-api-key` or `Authorization: Bearer <key>`.
* Compute SHA-256 hash using Node `crypto`.
* Query MongoDB for active key matching `keyHash`.
* Reject missing/invalid keys with `401 Unauthorized` or `403 Forbidden`.
* Update `lastUsedAt` asynchronously without blocking request execution.
* Provide a scope-checking middleware helper `requireScope(scope: string)`.

### 4.2 API Key Management Endpoints (User Protected)
Routes under `/keys` (requires standard user session/JWT):

* `POST /keys`:
  * **Body:** `{ name: string, scopes?: string[] }`
  * **Logic:** 
    1. Generate high-entropy string: `sk_live_${crypto.randomBytes(24).toString('hex')}`.
    2. Compute SHA-256 hash.
    3. Save record with `prefix: sk_live_XXXX...`.
    4. **Response (201):** `{ apiKey: string, prefix: string, name: string, id: string }` *(Return raw key ONLY here)*.
* `GET /keys`:
  * Returns list of user's active/revoked keys (excludes `keyHash`).
* `DELETE /keys/:id`:
  * Soft delete / deactivate key (`isActive = false`).

### 4.3 Agent Endpoints
Routes under `/agent/tasks` (protected by `agentAuth`):

* `GET /agent/us`:
  * Scope required: `read:user stories`.
  * Query parameters supported: `status`, `limit` (default 50), `sortBy`.
  * **Response (200):** Array of sanitized task objects (`_id`, `title`, `description`, `status`, `priority`, `tags`, `createdAt`).
* `POST /agent/us`:
  * Scope required: `write:user stories`.
  * **Body:** `{ title: string, description: string, storyPoints: number - 1/3/5/8/666, featureId: string }`
  * Validation: Validate required fields and types.
  * **logic:** use the current sprint as the sprint for the new user story and the createdByUser for assigned user.
  * **Response (201):** Newly created task object.
* `GET /agent/feature`:
  * Scope required: `read:features`.
  * **Response (200):** Array of sanitized task objects (_id, title, description, status)

## 5. Frontend Implementation (React & TypeScript)

### 5.1 Route & View: Developer Settings / Integrations
Add a new page/tab under settings: `src/pages/DeveloperSettings.tsx`.

#### Component 1: Key Management
* **Generate Key Modal:**
  * Input for key name (e.g., "Cursor MCP", "Local Agent").
  * Upon generation: Display raw API key in a read-only input with a **Copy to Clipboard** button.
  * Prominent warning: *"Copy this key now. You will not be able to view it again."*
* **Active Keys Table:**
  * Columns: Name, Prefix (`sk_live_ab12...`), Scopes, Created Date, Last Used, Actions (Revoke button).

#### Component 2: MCP Quickstart & Config Snippet
Provide an interactive copyable configuration block with a selector for MCP hosts (Claude Desktop, Cursor, Windsurf):

```json
{
  "mcpServers": {
    "mjolnir": {
      "command": "npx",
      "args": ["-y", "@mjolnir/mcp-server"],
      "env": {
        "MJOLNIR_API_KEY": "YOUR_COPIED_KEY_HERE",
        "MJOLNIR_API_URL": "https://<your-backend-domain>"
      }
    }
  }
}
```

## 6. MCP Server Specification (`packages/mcp-server`)

Create a lightweight CLI package implementing the Model Context Protocol SDK (`@modelcontextprotocol/sdk`):

### Tools to Expose:
1. `mjolnir_list_tasks`:
   * **Description:** "Fetch existing tasks from the Mjolnir agile board with optional status filtering."
   * **Input Schema:** `{ status?: string, limit?: number }`
   * **Handler:** Calls `GET ${MJOLNIR_API_URL}/agent/us` with `x-api-key`.

2. `mjolnir_create_task`:
   * **Description:** "Create a new task on the Mjolnir agile board."
   * **Input Schema:** `{ title: string (required), description?: string, priority?: 'low' | 'medium' | 'high' }`
   * **Handler:** Calls `POST ${MJOLNIR_API_URL}/agent/us` with `x-api-key`.

3. `mjolnir_list_feature`:
   * **Description:** "Fetch existing features from Mjolnir."
   * **Input Schema:** `{}`
   * **Handler:** Calls `GET ${MJOLNIR_API_URL}/agent/feature` with `x-api-key`.

## 7. Acceptance Criteria

- [ ] API keys are stored only as SHA-256 hashes in MongoDB.
- [ ] Raw API keys are shown to the user exactly once upon generation.
- [ ] Requests to `/api/v1/agent/tasks` without a valid key return `401 Unauthorized`.
- [ ] Agents can successfully query and create tasks via HTTP using standard API keys.
- [ ] The MCP server CLI connects locally via stdio and allows an LLM to trigger task creation and reading.
- [ ] Frontend integration page provides clear instructions and copy-paste JSON snippets.
