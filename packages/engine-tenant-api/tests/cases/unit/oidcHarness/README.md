# OIDC fake IdP harness

`FakeIdp.ts` is a fake OpenID Connect provider served over real HTTP on a random port: discovery, JWKS, authorization, token, userinfo, introspection and end-session endpoints, with an in-memory store of codes and tokens. It records every request (`requests`, `clientAuth`), takes per-endpoint failure overrides (`override(endpoint, …)`), and supports issuer quirks (`basePath`, `issuer`, `idTokenIssuer`, `idTokenClaims`, `endpointHosts`). It does not depend on `openid-client`.

The tests here drive `OIDCProvider` through its public methods only (`initAuth`, `processResponse`, `revalidate`, `buildLogoutUrl`, `validateLogoutToken`) and pin today's behaviour on openid-client 5.7.1. After a library upgrade, a failing test here is a behaviour change to decide on, not a test to update.

| File | Pins |
|---|---|
| `responseTypes.test.ts` | every stored `responseType` with and without `strictResponseType`: authorization URL, response mode, which endpoints the callback calls, the normalized response; escalated response types; `form_post`; the URL callback form |
| `clientAuthentication.test.ts` | the default `client_secret_basic` (and its exact encoding), `client_secret_post`, `client_secret_jwt`, `none`, on the token and introspection endpoints |
| `egressGuard.test.ts` | every outbound request passes the egress guard (discovery, token, ID-token and logout-token JWKS, userinfo, refresh, introspection): the fake is served as the allow-listed `127.0.0.2`, and an endpoint moved to `localhost` must be refused by the guard's lookup (Linux: all of 127.0.0.0/8 is loopback) |
| `errorClassification.test.ts` | which IdP failures revoke a session and which propagate as transient, and the sign-in error classes |
| `sessionRevalidation.test.ts` (logout) | the RP-initiated logout URL, and `null` without an `end_session_endpoint` |
| `sessionRevalidation.test.ts` | the session captured at sign-in and what a refresh or userinfo revalidation stores |
| `issuerQuirks.test.ts` | realm paths, trailing slashes, an issuer unrelated to the discovery URL, a `{tenantid}` template outside Microsoft |

Behaviour an upgrade is likely to change, each pinned by a test:

- Discovery does not compare the advertised `issuer` with the configured URL: a trailing-slash mismatch or an unrelated issuer is accepted.
- `{tenantid}` is substituted from the token's `tid` only for issuers discovered from the Microsoft multi-tenant discovery URLs (`https://login.microsoftonline.com/{common,organizations,consumers}/…`). The test pins the other half: anywhere else the template is compared literally. The Microsoft half is not pinned. It would need the fake served as `https://login.microsoftonline.com` on port 443, and Bun 1.3.14 (the CI runtime) offers no seam for that: it ignores an agent's `createConnection`, and it drops the `lookup` result when the port comes from `agent.defaultPort`. Check it by hand on an upgrade.
- `client_secret_basic` leaves `- _ . ! ~ * ' ( )` unencoded; the `client_secret_jwt` assertion's `aud` is the issuer.
- A request timeout is an `RPError`: transient on revalidation, but an `IDPValidationError` at sign-in.
- `responseType: 'none'` cannot complete a sign-in (`TypeError: id_token not present in TokenSet`).
- The logout-token JWKS is fetched by jose (the guard's `fetch`, or the global `fetch` without a guard), separately from openid-client's ID-token JWKS; a refused fetch surfaces as `IDPValidationError`.

Without an egress guard, jose uses the global `fetch`, which the test preload replaces with happy-dom's; tests that verify a logout token therefore pass a guard that allows `localhost`.
