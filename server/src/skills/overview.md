---
name: overview
version: 1
---
# Mjolnir overview

Mjolnir is a Scrumban tool. Hierarchy: **Epic → Feature → User Story**.

All calls go to `$MJOLNIR_URL/api/agent/...` with `Authorization: Bearer $TOKEN` and `Content-Type: application/json`.

## Story statuses
`To Do`, `In Progress`, `Blocked`, `Waiting for MR`, `Done`.

## Rules the server enforces
- Moving a story to `In Progress` also sets its Feature and Epic to `In Progress`.
- When all stories of a Feature are `Done`, the Feature becomes `Done`.
- WIP limits are 1 `In Progress` and 1 `Waiting for MR` per user. Respect them: before starting a story, check that you have no other story `In Progress`, and tell the user if you do.
- `storyPoints` is mandatory when creating a story.

## What you can NOT do (returns 405/403)
Delete anything, edit story title/description/points after creation, create or edit Epics, Features or Sprints, change users.

## Errors
- `401` token invalid, expired or revoked: re-authenticate.
- `403` account not approved: tell the user, do not retry.
- `400` bad input: read `message` and fix the request.
- `404` unknown id.

## Other skills
Fetch `GET /api/agent/skills?name=stories` and `?name=planning` for endpoint details.
