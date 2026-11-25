---
name: planning
version: 1
---
# Planning data (read-only)

| Endpoint | Returns |
|---|---|
| `GET /api/agent/epic` | All epics |
| `GET /api/agent/feature?epicId=<id>` | Features, optionally filtered by epic |
| `GET /api/agent/sprints` | Sprints with dates (the active one contains today) |
| `GET /api/agent/users` | Approved team members (for `assignedUserId`) |
| `GET /api/agent/me` | The authenticated user |

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$MJOLNIR_URL/api/agent/feature"
```

Use these to find the `featureId` before creating a story. If the right feature is unclear, ask the user.
