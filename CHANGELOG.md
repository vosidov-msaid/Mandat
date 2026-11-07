# Changelog

Mandat follows [semantic versioning](https://semver.org). Before 1.0, minor versions may change APIs.
The npm package (`mandat`) and the Python package (`mandat` on PyPI) are versioned separately.

## npm 0.2.0 (2026-11-07)

A security and reliability release. **Check the changes below before you upgrade.**

**Changes that can affect you:**

- **Scope removed from task tokens.** The `scope` request parameter is now ignored: agents could set any value. `principal.scope` no longer exists in policies, so a rule that reads it now fails closed.
- **Sub-agent tokens stay on their parent's server.** Exchanging a task token for a different `resource` now returns `invalid_target`.
- **E-mail role grants need a verified e-mail.** A grant by e-mail applies only when the ID token says `email_verified: true`. If your provider doesn't send that claim, grant by subject: `mandat users grant --sub <subject> --roles approver`.
- **The dev IdP only runs locally.** A control plane with `devIdp: true` now refuses to start on a non-local host or an `https` issuer.
- **Large reports run in the CLI.** `/api/report` refuses ledgers over 500 MB. Use `mandat ledger report` for those.

**Security fixes:**

- **Scanner page:** a scanned server could crash the whole process with an invalid HTTP status. This affects anyone hosting `mandat web`.
- **Delegation:** sub-agents could widen `enum` and `equals` limits. All limits now only narrow.
- **Audit ledger:** anonymous requests could fill the ledger through made-up client ids and tokens. Rejected logins are now limited by reason and source, and their stored values are shortened.
- **Console sign-in:** a login link started in another browser could sign a victim in to the attacker's account. Each login is now tied to the browser that started it.

**Reliability fixes:**

- **Ledger size:** the control plane no longer fails at about 512 MB, and console polling no longer re-reads the whole file. Startup now scans the ledger, so it takes longer on large ledgers.
- **Control plane outages:** guards keep verifying tokens with cached signing keys. Previously every tool call failed after 10 minutes.
- **Audit delivery:** a large record or backlog could block delivery from a guard for good. Arguments over 100 KB are now recorded as a hash.
- **Dropped audit records:** when the delivery queue is full, records dropped are counted in `dropped` on `HttpLedgerSink` and logged.
- **Crash recovery:** a write cut short by a crash no longer stops startup. The unfinished bytes move to `ledger.jsonl.torn`.

## PyPI 0.2.0 (2026-11-07)

- **Changed:** `scope` no longer reaches policies or the token verifier, because task tokens stop carrying it. `principal.scope` no longer exists, so a rule that reads it now fails closed.
- **Security:** made-up tokens can't flood the ledger. Rejected tokens are limited by reason, and their stored values are shortened.
- **Control plane outages:** guards keep verifying tokens with cached signing keys.
- **Audit delivery:** arguments over 100 KB are recorded as a hash, so large records can't block delivery. Upgrade the control plane too: it needs npm 0.2.0 to accept the larger batches.
- **Dropped audit records:** records dropped from a full queue are counted in `HttpLedger.dropped` and logged.

## npm 0.1.5 (2026-11-04)

- **Scanner: correct results against MCP revision 2026-07-28 servers.** These servers reject an old-style `initialize` that carries a `MCP-Protocol-Version: 2026-07-28` header, so earlier versions could not assess them. The scanner and `McpHttpClient` now send the header only after negotiating it.
- **Scanner calibration:**
  - a server whose tools are all `readOnlyHint` is reported as a public read-only server (*medium*) instead of *critical*;
  - CORS that allows any origin is *high* only together with credentials;
  - a rejected probe is reported as "not assessable" instead of missing metadata;
  - a `400` for a malformed bearer token counts as rejecting it.
- **Scanner web page:** an HSTS header behind HTTPS proxies, and `--client-ip-header` for platform proxies such as Fly.io's `Fly-Client-IP`.
- **Deployment:** a `Dockerfile` and `fly.toml` for the scanner page.
- **GitHub Action:** it now sets up Node 24 itself; it previously failed on runners with an older Node.

## npm 0.1.4 (2026-11-04)

- **Scanner web page (`mandat web`):** paste a server URL or a client config and get a graded report with a share link. Safe to host publicly: SSRF-safe fetch, passive checks only, rate limits.
- **Verified with the official MCP TypeScript SDK and MCP Inspector**, which revealed and fixed a typing problem in `protect()`.

## PyPI 0.1.0 (2026-11-04)

- First release of the Python SDK. It provides the guard, `protect(MCPServer)` and a token verifier for the official `mcp` 2.x SDK, and decides identically to the TypeScript SDK (shared conformance suite).

## npm 0.1.3 (2026-11-04)

- **People sign in with your identity provider:** in the console (browser login) and in the CLI (`--login`). Roles are granted with `mandat users`, and self-approval is checked against verified identities.
- **Rejected logins are recorded in the audit ledger:** `auth.rejected`, `token.denied` and `api.auth_rejected`, rate-limited.
- **`mandat agents rotate-secret` and `mandat agents remove`.**
- **Releases are built in CI** with npm Trusted Publishing and provenance, and approved by a maintainer.

## npm 0.1.2 (2026-11-04)

- `mandat idp add` accepts a bare domain as the issuer.
- A guard fails loudly when the control plane rejects its API key.

## npm 0.1.1 (2026-11-04)

- **Real users through OpenID Connect:** `mandat login` (browser login with PKCE), `mandat idp add` and `mandat bridge --login`.
- **`mandat bridge`** connects Claude Code, Codex and other stdio MCP clients.

## npm 0.1.0 (2026-11-04)

- First release:
  - a policy engine with argument rules;
  - token exchange with delegation chains;
  - guards for MCP servers;
  - approvals, revocation and a hash-chained audit ledger;
  - the scanner, the web console and the CLI.
