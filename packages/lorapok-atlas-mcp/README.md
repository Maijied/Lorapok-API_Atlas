# lorapok-atlas-mcp

> MCP server for [Lorapok Atlas](https://maijied.github.io/Lorapok-API_Atlas/) — gives AI assistants (Claude, Cursor, Kiro) access to 2100+ curated APIs.

[![npm](https://img.shields.io/npm/v/lorapok-atlas-mcp?style=flat-square)](https://www.npmjs.com/package/lorapok-atlas-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-34d399?style=flat-square)](../../LICENSE)

## Setup

### Claude Desktop / Cursor / Kiro

Add to your MCP config:

```json
{
  "mcpServers": {
    "lorapok-atlas": {
      "command": "npx",
      "args": ["lorapok-atlas-mcp"]
    }
  }
}
```

**Kiro**: `.kiro/settings/mcp.json`
**Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Cursor**: `.cursor/mcp.json`

## Tools

| Tool | Description |
|---|---|
| `search_apis` | Search 2100+ APIs by query, category, or auth type |
| `get_api` | Get full details for a specific API |
| `get_code_snippet` | Get cURL/JS/Python/Go snippet for any API |
| `list_categories` | List all 34 categories with counts |
| `get_apis_by_category` | Get all APIs in a category |
| `get_random_api` | Get a random API |
| `get_stats` | Directory statistics |

## Example prompts

Once connected, you can ask your AI assistant:

- *"Find me a free weather API"*
- *"Show me all AI APIs that don't require a key"*
- *"Get the JavaScript snippet for the Open-Meteo Forecast API"*
- *"What crypto APIs are available?"*
- *"Give me a random API to explore"*

## License

MIT © [Lorapok](https://github.com/Maijied)
