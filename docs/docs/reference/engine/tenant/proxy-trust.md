---
title: Trusted proxies and forwarded client info
---

When a backend service calls Contember on behalf of an end user, the request reaches Contember from the backend's IP with the backend's User-Agent — not the user's. By default this is what gets recorded into [session tracking](./sessions.md), [audit logs](./audit-log.md), and Content API `userInfo`. For most integrations that is fine.

For the cases where you need the real user's IP and User-Agent to flow all the way through, the Tenant API has an opt-in mechanism: a per-api-key `trustForwardedClientInfo` flag plus two HTTP headers.

:::note Available since 2.2
:::

:::danger Security contract
A proxy that uses this feature **must** strip any incoming `X-Contember-Client-IP` / `X-Contember-Client-User-Agent` headers from upstream traffic and re-inject them with values it trusts. Without that, any client holding a session token minted with this flag can spoof their own IP and User-Agent in Contember's audit log.
:::

:::danger Backend-only key
An api_key with `trustForwardedClientInfo: true` (and any session token minted from one) must **never** reach the end client — no shipping it to the browser, no embedding it in a public app, no handing it to untrusted code. The flag tells Contember to take the IP/User-Agent that arrives in two HTTP headers as ground truth. A holder of such a key who can craft their own requests can:

- **Bypass per-IP rate limits** on `signIn`, `signUp`, `createResetPasswordRequest`, and `initSignInPasswordless` by rotating `X-Contember-Client-IP` per attempt.
- **Forge `client_ip` / `user_agent`** in the audit log, in session-tracking columns, and in Content API `userInfo`.

Use the flag only on api_keys that live entirely server-side behind a proxy you operate (the proxy strips and re-injects the headers as described below). For anything that touches the browser, mint plain api_keys without the flag.
:::

## How it works

1. You create an api_key with `trustForwardedClientInfo: true`.
2. Your proxy strips any client-supplied `X-Contember-Client-IP` / `X-Contember-Client-User-Agent` headers, then re-injects them with the real user's values.
3. Your proxy authenticates to Contember using that api_key.
4. Contember sees the flag on the api_key, honors the forwarded headers, and treats those values as the request's effective client IP / User-Agent for the purposes of:
   - Per-IP rate limiting
   - Session tracking columns (`last_ip`, `last_user_agent`, `created_ip`, `created_user_agent`)
   - Content API `userInfo.ipAddress`
   - Audit log `client_ip` / `user_agent`
5. The proxy's own socket IP and User-Agent are not lost — they are preserved in `metadata.forwarderIp` and `metadata.forwarderUserAgent` on every audit-log entry from that request, so forensic queries can still trace back to the proxy.

When the api_key does **not** have the flag, or the headers are absent, Contember uses the socket IP/UA as before.

## Socket IP resolution and `X-Forwarded-For`

Everything above is the *application-level* mechanism (`X-Contember-Client-IP`, gated by an api_key flag). Below it sits a *network-level* step that determines the **socket IP** in the first place — the value used as the client IP when the trust flag is off, and preserved as `forwarderIp` when it is on.

Contember resolves the socket IP from the TCP peer address and, when appropriate, the `X-Forwarded-For` (XFF) header:

- If the connection arrives from a **trusted network** — loopback (`127.0.0.0/8`, `::1`), private (RFC1918), IPv6 unique-local (`fc00::/7`), link-local (`fe80::/10`), or any range in `CONTEMBER_HTTP_TRUSTED_PROXIES` — Contember reads `X-Forwarded-For` and takes the **rightmost** address that is itself not trusted. This is the real client in front of your proxy chain.
- Otherwise (the connection comes straight from a public peer), `X-Forwarded-For` is **ignored** and the raw peer IP is used. A client connecting directly therefore cannot spoof its IP via XFF.

This anti-spoofing only holds if your proxy *appends* the peer it saw to `X-Forwarded-For` (e.g. nginx `$proxy_add_x_forwarded_for`) rather than passing through a client-supplied one.

### `CONTEMBER_HTTP_TRUSTED_PROXIES`

By default only loopback/private/link-local peers are trusted to set `X-Forwarded-For`. If Contember sits behind a load balancer that connects from a **public** IP (or a non-private network), list its address(es) here so XFF is honored:

```bash
# comma-separated; CIDR notation or bare addresses (bare → /32 or /128)
CONTEMBER_HTTP_TRUSTED_PROXIES="203.0.113.0/24, 198.51.100.7, 2001:db8::/32"
```

An invalid entry fails server startup rather than being silently dropped. Without this set, a public-facing load balancer's own IP would be recorded as the client IP, because XFF from an untrusted peer is ignored.

## Enabling on a permanent api_key

Set the flag at creation time via the `options` field:

```graphql
mutation {
  createGlobalApiKey(
    description: "Backend → Contember (per-user)",
    roles: ["login"],
    options: { trustForwardedClientInfo: true }
  ) {
    ok
    result {
      apiKey {
        id
        token
      }
    }
  }
}
```

The same `options.trustForwardedClientInfo` is available on `createApiKey` for project-scoped keys.

The flag cannot be flipped on an existing api_key — create a new one with the flag and rotate.

## Propagating to session tokens

Sessions minted *by* an api_key that has `trustForwardedClientInfo` can also be flagged. The sign-in mutations and `createSessionToken` accept the flag via `SignInOptions`:

```graphql
mutation {
  signIn(
    email: "alice@example.com",
    password: "…",
    options: { trustForwardedClientInfo: true }
  ) {
    ok
    result { token }
  }
}
```

The flag is honored only when the caller's api_key already has `trustForwardedClientInfo: true`. If the calling key does not have it, the flag is **silently ignored** — no error, the resulting session is just a normal session that trusts the socket IP/UA. This silent-propagation rule prevents a session minted with the public login token from spoofing client info.

## Proxy implementation example

A minimal nginx fragment for a backend that wants the user's IP forwarded into Contember:

```nginx
location /contember/ {
    # 1. Strip whatever the client tried to send.
    proxy_set_header X-Contember-Client-IP        "";
    proxy_set_header X-Contember-Client-User-Agent "";

    # 2. Re-inject with values we trust. $remote_addr is nginx's
    #    socket IP; if you sit behind another trusted hop, replace
    #    with realip_remote_addr or your own resolution.
    proxy_set_header X-Contember-Client-IP        $remote_addr;
    proxy_set_header X-Contember-Client-User-Agent $http_user_agent;

    # 3. Authenticate with the api_key that has trustForwardedClientInfo=true.
    proxy_set_header Authorization "Bearer <backend-api-key>";

    proxy_pass http://contember-engine:4000;
}
```

The two `proxy_set_header` calls per header are intentional: the first one clears the header (overriding what the client sent), the second one sets the trusted value. Doing only the second one leaves the door open to header smuggling in some nginx versions.

## Audit forensics

Every request authenticated through a trust-forwarded chain produces audit entries where:

- `client_ip` / `user_agent` = the values the proxy injected
- `metadata.forwarderIp` / `metadata.forwarderUserAgent` = the proxy's actual socket IP / User-Agent

Queries that need to "show me every action this end-user took" use `client_ip`. Queries that need to "show me every action that hit through this proxy" use `metadata.forwarderIp`.
