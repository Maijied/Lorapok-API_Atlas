# lorapok-atlas-mcp

> MCP server for [Lorapok Atlas](https://maijied.github.io/Lorapok-API_Atlas/) — gives AI assistants (Claude, Cursor, Kiro) access to 2100+ curated APIs.

[![npm](https://img.shields.io/npm/v/lorapok-atlas-mcp?style=flat-square&color=38bdf8)](https://www.npmjs.com/package/lorapok-atlas-mcp)
[![npm downloads](https://img.shields.io/npm/dm/lorapok-atlas-mcp?style=flat-square&color=34d399)](https://www.npmjs.com/package/lorapok-atlas-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-34d399?style=flat-square)](../../LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Lorapok--API__Atlas-181717?style=flat-square&logo=github)](https://github.com/Maijied/Lorapok-API_Atlas)

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

---

## 💛 Decentralized Support

If this project helped you, consider supporting via USDT. No accounts, no middlemen — direct on-chain.

| Network | Token | Address |
|:--------|:------|:--------|
| 🟡 BNB Smart Chain (BEP20) | USDT | `0xfbaae60922e40bdcc82142ac6d6ff9c69bb12d26` |
| 🔷 Ethereum (ERC20) | USDT | `0xfbaae60922e40bdcc82142ac6d6ff9c69bb12d26` |
| 🔴 Tron (TRC20) | USDT | `TNicohFHB9VYPSq2ksqRD73Ubhi9QVAVZm` |
| 🟣 Solana | USDT | `HMbxpSyhSS99xC9fVdMMtbnrbjBEvSP2ww2KXUoqwe7D` |
| 🔵 Aptos | USDT | `0xb9a6776cfce10ee3755ecaa39f8aeb5b4f1edaa0adaccf4c79260c63bce27e3d` |

> ⚠️ Only send USDT to the matching network. Do not send NFTs or other tokens.

---

## 💻 Developer

<div align="center">

<a href="https://gravatar.com/lorapok" target="_blank">
  <img src="https://0.gravatar.com/avatar/7c901cfacc79334975b520600a357d97cf33eff6646608a0f91786744eda6c37?s=96&d=initials" width="80" height="80" style="border-radius:50%" alt="Mohammad Maizied Hasan Majumder" />
</a>

**Mohammad Maizied Hasan Majumder**
Founder, Lorapok Labs · Dhaka, Bangladesh

[![Gravatar](https://img.shields.io/badge/Gravatar-lorapok-1a1a2e?style=flat-square)](https://gravatar.com/lorapok)
[![GitHub](https://img.shields.io/badge/GitHub-maijied-181717?style=flat-square&logo=github)](https://github.com/maijied)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-maizied-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/maizied/)

</div>
