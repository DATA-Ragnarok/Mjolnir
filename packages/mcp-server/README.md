# Mjolnir MCP Server

Model Context Protocol server for Mjolnir agile board integration with AI editors and IDEs.

## Installation

```bash
npm install @mjolnir/mcp-server
```

## Usage

### Configuration

Add to your Claude Desktop, Cursor, or Windsurf configuration file:

```json
{
  "mcpServers": {
    "mjolnir": {
      "command": "npx",
      "args": ["-y", "@mjolnir/mcp-server"],
      "env": {
        "MJOLNIR_API_KEY": "sk_live_...",
        "MJOLNIR_API_URL": "https://your-mjolnir-api.com"
      }
    }
  }
}
```

### Environment Variables

- `MJOLNIR_API_KEY` (required): Your Mjolnir API key
- `MJOLNIR_API_URL` (optional): Base URL of your Mjolnir API (defaults to https://api.mjolnir.dev)

## Available Tools

### mjolnir_list_tasks
Fetch existing tasks from the Mjolnir agile board with optional status filtering.

**Parameters:**
- `status` (string, optional): Filter by status (To Do, In Progress, Blocked, Waiting for MR, Done)
- `limit` (number, optional): Maximum number of tasks to return (default: 50, max: 500)

### mjolnir_create_task
Create a new task on the Mjolnir agile board.

**Parameters:**
- `title` (string, required): Task title
- `description` (string, optional): Task description
- `storyPoints` (number, optional): Story points (1, 3, 5, 8, or 666)
- `featureId` (string, required): Feature ID to associate with this task

### mjolnir_list_features
Fetch existing features from Mjolnir.

**Parameters:** None

## Development

```bash
npm run build      # Build the TypeScript
npm run watch      # Watch mode
npm run dev        # Build and run
```

## License

MIT
