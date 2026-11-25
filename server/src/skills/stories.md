---
name: stories
version: 1
---
# Stories (User Stories / tasks)

## List stories
`GET /api/agent/us`

Query params (all optional):
- `assignedUser`: `me` (default), `all`, or a user id
- `sprint`: `active` (default), `backlog`, `all`, or a sprint id
- `featureId`, `status` (one of the 5 statuses), `limit` (1-200, default 50)

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$MJOLNIR_URL/api/agent/us?status=In%20Progress"
```

## Get one
`GET /api/agent/us/:id`

## Create
`POST /api/agent/us`

Body: `title` (required), `storyPoints` (required number), `featureId` (required), `description`, `sprintId`, `assignedUserId`.

```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Fix login bug","storyPoints":3,"featureId":"<featureId>"}' \
  "$MJOLNIR_URL/api/agent/us"
```

## Update status (the only allowed update)
`PATCH /api/agent/us/:id/status`

Body: `{ "status": "In Progress" }`

```bash
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"Done"}' "$MJOLNIR_URL/api/agent/us/<id>/status"
```

Always confirm with the user before moving a story to `Done` unless they asked for it.
