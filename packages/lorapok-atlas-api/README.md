# lorapok-atlas-api

> Cloudflare Worker REST API for [Lorapok Atlas](https://maijied.github.io/Lorapok-API_Atlas/) — serves 2100+ APIs as a REST endpoint.

## Base URL

```
https://api.lorapok.dev
```

## Endpoints

```
GET /                          API info and endpoint list
GET /apis                      List all APIs
GET /apis?q=weather            Search APIs
GET /apis?category=AI          Filter by category
GET /apis?auth=free            Filter by auth (free|key|oauth)
GET /apis?limit=20&offset=0    Pagination
GET /apis/:name                Get API by name
GET /apis/random               Random API
GET /categories                All 34 categories with counts
GET /stats                     Directory statistics
GET /search?q=weather          Search endpoint
```

## Examples

```bash
# Search for weather APIs
curl https://api.lorapok.dev/apis?q=weather&auth=free

# Get a specific API
curl https://api.lorapok.dev/apis/Open-Meteo%20Forecast

# List all categories
curl https://api.lorapok.dev/categories

# Get stats
curl https://api.lorapok.dev/stats
```

## Deploy your own

```bash
cd packages/lorapok-atlas-api
npm install
npm run deploy
```

Requires a [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works).

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
