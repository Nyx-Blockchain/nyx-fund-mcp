#!/usr/bin/env node
// nyx-fund-mcp — stdio ⇄ Streamable-HTTP proxy for the Nyx Fund MCP servers.
//
// Default target is the free public tool server (no API key required):
//   https://nyxchain.org/api/mcp/public
// With --api-key nyx_sk_... it targets the fund-scoped server instead:
//   https://nyxchain.org/api/mcp
//
// Zero dependencies; Node >= 18 (global fetch). Speaks newline-delimited
// JSON-RPC on stdio (the MCP stdio transport) and forwards each message as a
// single Streamable-HTTP POST, writing the JSON response back to stdout.
// Notifications (id-less messages) are forwarded and produce no stdout output.

'use strict'

const PUBLIC_URL = 'https://nyxchain.org/api/mcp/public'
const FUND_URL = 'https://nyxchain.org/api/mcp'
const PROTOCOL_VERSION_HEADER = 'mcp-protocol-version'

function parseArgs(argv) {
  const args = { apiKey: null, url: null }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--api-key') args.apiKey = argv[++i] ?? null
    else if (a.startsWith('--api-key=')) args.apiKey = a.slice('--api-key='.length)
    else if (a === '--url') args.url = argv[++i] ?? null
    else if (a.startsWith('--url=')) args.url = a.slice('--url='.length)
    else if (a === '--help' || a === '-h') {
      process.stderr.write(
        'Usage: nyx-fund-mcp [--api-key nyx_sk_...] [--url https://...]\n' +
          '  no flags        proxy the free public Nyx Fund tool server\n' +
          '  --api-key KEY   proxy the fund-scoped server with your Nyx API key\n' +
          '  --url URL       override the target endpoint entirely\n',
      )
      process.exit(0)
    }
  }
  if (!args.apiKey && process.env.NYX_API_KEY) args.apiKey = process.env.NYX_API_KEY
  return args
}

const { apiKey, url } = parseArgs(process.argv)
const target = url ?? (apiKey ? FUND_URL : PUBLIC_URL)

let negotiatedVersion = null

async function forward(line) {
  let msg
  try {
    msg = JSON.parse(line)
  } catch {
    // Not valid JSON — surface a parse error the way a server would.
    process.stdout.write(
      JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n',
    )
    return
  }

  const isNotification = !Object.prototype.hasOwnProperty.call(msg, 'id')
  if (msg.method === 'initialize' && msg.params && typeof msg.params.protocolVersion === 'string') {
    negotiatedVersion = msg.params.protocolVersion
  }

  const headers = { 'content-type': 'application/json', accept: 'application/json' }
  if (apiKey) headers.authorization = `Bearer ${apiKey}`
  if (negotiatedVersion) headers[PROTOCOL_VERSION_HEADER] = negotiatedVersion

  try {
    const res = await fetch(target, { method: 'POST', headers, body: JSON.stringify(msg) })
    if (isNotification) return // 202-no-body by contract; nothing to write either way
    const text = await res.text()
    if (text.trim().length > 0) {
      process.stdout.write(text.trim() + '\n')
    } else {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: '2.0',
          id: msg.id ?? null,
          error: { code: -32000, message: `Empty response from server (HTTP ${res.status})` },
        }) + '\n',
      )
    }
  } catch (err) {
    if (isNotification) return
    process.stdout.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id: msg.id ?? null,
        error: { code: -32000, message: `Network error reaching ${target}: ${err && err.message ? err.message : err}` },
      }) + '\n',
    )
  }
}

// Newline-delimited JSON reader over stdin. Messages are processed strictly in
// order (awaited serially) so responses can never interleave out of order.
let buffer = ''
let chain = Promise.resolve()
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => {
  buffer += chunk
  let idx
  while ((idx = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, idx).trim()
    buffer = buffer.slice(idx + 1)
    if (line.length > 0) chain = chain.then(() => forward(line))
  }
})
process.stdin.on('end', () => {
  chain.then(() => process.exit(0))
})
