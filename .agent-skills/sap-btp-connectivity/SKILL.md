---
name: sap-btp-connectivity
description: Use when configuring or debugging ABAP-MCP connectivity through SAP BTP Connectivity Proxy, Cloud Connector, SAProuter, HTTP CONNECT proxies, VPNs, or direct HTTPS.
version: 1.0.0
author: ABAP-MCP maintainers
license: MIT
metadata:
  tags: [sap, btp, connectivity, cloud-connector, saprouter, proxy]
  portable_for: [codex, claude-code, hermes, opencode, cursor, cline]
---

# SAP BTP Connectivity and Network Routing

## Overview

ABAP-MCP can reach ABAP systems through four routing modes, selected in order: BTP Connectivity Proxy, SAProuter NI tunnel, HTTP CONNECT proxy, then direct HTTPS. This skill keeps agents from mixing those modes or leaking credentials while configuring them.

## When to Use

Use this skill for:

- `SAP_BTP_CONNECTIVITY_*`, `SAP_ROUTER`, or `SAP_PROXY_URL` changes.
- Cloud Connector and hybrid CAP development routing.
- Diagnosing `ENOTFOUND`, connection refused, HTTP 503, HTTP 405, TLS/self-signed certificate, or SAProuter errors.
- Writing docs for network setup.

## Routing Modes

| Priority | Mode | Key env vars | Use when |
|---:|---|---|---|
| 1 | BTP Connectivity Proxy | `SAP_BTP_CONNECTIVITY_PROXY`, token/binding vars | ABAP is exposed via Cloud Connector |
| 2 | SAProuter NI tunnel | `SAP_ROUTER`, optional `SAP_ROUTER_PASSWORD` | B2B/VPN routes through SAProuter |
| 3 | HTTP CONNECT proxy | `SAP_PROXY_URL` or `HTTPS_PROXY` | Corporate proxy or local tunnel |
| 4 | Direct HTTPS | `SAP_URL` only | Host is directly reachable |

Only configure one primary mode at a time unless intentionally testing precedence.

## BTP Connectivity Rules

- For Connectivity Proxy port `20003`, use `SAP_URL=http://virtual-host:port`; the Cloud Connector handles backend TLS.
- For CONNECT-style port `20004`, `SAP_URL=https://virtual-host:port` can be valid.
- The Cloud Connector must expose `/sap/bc/adt/*`.
- The XSUAA JWT authenticates to the proxy, not to the ABAP backend. ADT still uses `SAP_USER`/`SAP_PASSWORD` unless a future auth mode is implemented.
- Never commit service-key JSON. Reference paths or placeholders only.

Useful diagnostics:

```bash
npm run diag:btp-token
npm run diag:btp-destination -- --list
npm run diag:btp-proxy
npm run diag:adt
```

## SAProuter Rules

- SAProuter route strings belong in `SAP_ROUTER`, not in `SAP_URL`.
- `SAP_URL` remains the target ABAP HTTPS endpoint.
- If the router needs a password, keep it out of tracked files.
- SAProuter errors usually indicate route permission, wrong target host/port, or VPN/network state, not TypeScript handler bugs.

## TLS Rules

- `SAP_ALLOW_UNAUTHORIZED=true` is DEV-only and affects ADT connectivity.
- `WEB_ALLOW_UNAUTHORIZED=true` is separate and only for outbound web/documentation calls.
- Never recommend disabling TLS verification for PROD.

## Common Pitfalls

1. **Using `https://` with the 20003 forward proxy.** This often causes HTTP 405. Use `http://` for 20003.
2. **Putting `/H/.../S/...` in `SAP_URL`.** SAProuter routes are not URLs.
3. **Assuming BTP token means SAP login.** It only authorizes the tunnel.
4. **Diagnosing DNS with code changes.** If the host cannot resolve from the MCP host, fix DNS/VPN/proxy first.

## Verification Checklist

- [ ] Exactly one intended routing mode is active.
- [ ] No service keys or passwords were committed.
- [ ] `SAP_URL` protocol matches the selected proxy mode.
- [ ] `/sap/bc/adt/*` is exposed through Cloud Connector when using BTP.
- [ ] Relevant diagnostic script output was captured before claiming success.
