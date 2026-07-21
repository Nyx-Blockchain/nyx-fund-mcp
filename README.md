# nyx-fund-mcp

**MCP server for hedge fund operations.** Give Claude, Cursor, or any MCP client a fund back office: management/performance fee calculators (with high-water mark), NAV validation, exposure analysis, operating-cost and back-office-savings models, LP report grading, and searchable fund-ops docs — powered by [Nyx Fund](https://nyxchain.org/developers).

The public server is **free and requires no API key or signup**.

## Install

**Claude Code**

```bash
claude mcp add --transport http nyx-fund https://nyxchain.org/api/mcp/public
```

**Claude Desktop** (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "nyx-fund": {
      "command": "npx",
      "args": ["-y", "nyx-fund-mcp"]
    }
  }
}
```

**Cursor** — [one-click install](https://nyxchain.org/developers/mcp/cursor), or add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "nyx-fund": { "url": "https://nyxchain.org/api/mcp/public" }
  }
}
```

**Any stdio MCP client**

```bash
npx -y nyx-fund-mcp
```

This package is a zero-dependency stdio ⇄ Streamable-HTTP proxy (Node ≥ 18). Clients that speak Streamable HTTP natively can skip it and POST straight to `https://nyxchain.org/api/mcp/public`.

## Tools

| Tool | What it computes |
|---|---|
| `calc_fee_calculator` | Management + performance fees over a multi-year horizon, with a per-period high-water mark, fee drag, and net-of-fee CAGR |
| `calc_nav_validator` | Cross-checks a reported NAV against positions and flags the discrepancy |
| `calc_fund_health_check` | Scores fund operational health across fees, ops, and reporting |
| `calc_exposure_analysis` | Gross/net/long/short exposure and concentration from a position list |
| `calc_operating_cost_calculator` | Annual fund operating-cost model |
| `calc_back_office_savings` | Back-office cost vs. software-replacement comparison |
| `calc_lp_report_grader` | Grades an LP report's completeness against institutional norms |
| `search_docs` | Searches the Nyx Fund developer docs and API reference |

All calculator outputs are **illustrative computational tools**, not accounting, tax, or investment advice.

## Fund-scoped mode (Nyx Fund customers)

Nyx Fund customers can point any MCP client at their own fund's live data (positions, NAV history, exposure, risk, capital accounts — read-only, redacted) with a scoped API key:

```bash
npx -y nyx-fund-mcp --api-key nyx_sk_...
```

Keys are minted in the Nyx Fund dashboard (Settings → API keys). See the [MCP docs](https://nyxchain.org/developers/mcp).

## FAQ

**Is there an API version of these tools?** Yes — every calculator is also a REST endpoint (`POST https://nyxchain.org/api/v1/calc/<slug>`), documented with OpenAPI 3.1 at [nyxchain.org/api/v1/openapi.json](https://nyxchain.org/api/v1/openapi.json). Full reference: [nyxchain.org/developers](https://nyxchain.org/developers) · machine-readable: [nyxchain.org/llms-full.txt](https://nyxchain.org/llms-full.txt).

**How do I calculate hedge fund fees with a high-water mark?** Call `calc_fee_calculator` with AUM, management fee %, performance fee %, and expected gross return — it simulates the fee schedule year by year, banking crystallized performance fees against a per-period high-water mark, and reports total fees, fee drag, and net-of-fee CAGR.

**What is Nyx Fund?** The operating system for emerging crypto and multi-asset fund managers — a live shadow ledger, deterministic NAV, risk desk, and AI-written LP reports. [nyxchain.org](https://nyxchain.org)

## License

MIT © Nyx Capital
