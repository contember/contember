# OIDC fake IdP harness

`FakeIdp.ts` is a fake OpenID Connect provider served over real HTTP(S) on a random port: discovery, JWKS, authorization, token, userinfo, introspection and end-session endpoints, with an in-memory store of codes and tokens. It records every request (`requests`, `clientAuth`), takes per-endpoint failure overrides (`override(endpoint, …)`), and supports issuer quirks (`basePath`, `issuer`, `idTokenIssuer`, `publicOrigin`, `endpointHosts`). It does not depend on `openid-client`.

The tests here drive `OIDCProvider` through its public methods only (`initAuth`, `processResponse`, `revalidate`, `buildLogoutUrl`, `validateLogoutToken`) and pin today's behaviour on openid-client 5.7.1. After a library upgrade, a failing test here is a behaviour change to decide on, not a test to update.

| File | Pins |
|---|---|
| `responseTypes.test.ts` | every stored `responseType` with and without `strictResponseType`: authorization URL, response mode, which endpoints the callback calls, the normalized response; escalated response types; `form_post`; the URL callback form |
| `clientAuthentication.test.ts` | the default `client_secret_basic` (and its exact encoding), `client_secret_post`, `client_secret_jwt`, `none`, on the token and introspection endpoints |
| `egressGuard.test.ts` | every outbound request passes the egress guard (discovery, token, ID-token and logout-token JWKS, userinfo, refresh, introspection) |
| `errorClassification.test.ts` | which IdP failures revoke a session and which propagate as transient, and the sign-in error classes |
| `sessionRevalidation.test.ts` | the session captured at sign-in and what a refresh or userinfo revalidation stores |
| `issuerQuirks.test.ts` | realm paths, trailing slashes, an issuer unrelated to the discovery URL, a `{tenantid}` template outside Microsoft |
| `entraMultiTenant.test.ts` | Entra ID's `{tenantid}` issuer, served as `https://login.microsoftonline.com` through a redirecting agent (certificate made with `openssl` at test time) |

Behaviour an upgrade is likely to change, each pinned by a test:

- Discovery does not compare the advertised `issuer` with the configured URL: a trailing-slash mismatch or an unrelated issuer is accepted.
- `{tenantid}` is substituted from the token's `tid` only for issuers discovered from the Microsoft multi-tenant discovery URLs.
- `client_secret_basic` leaves `- _ . ! ~ * ' ( )` unencoded; the `client_secret_jwt` assertion's `aud` is the issuer.
- A request timeout is an `RPError`: transient on revalidation, but an `IDPValidationError` at sign-in.
- `responseType: 'none'` cannot complete a sign-in (`TypeError: id_token not present in TokenSet`).
- The logout-token JWKS is fetched by jose (the guard's `fetch`, or the global `fetch` without a guard), separately from openid-client's ID-token JWKS; a refused fetch surfaces as `IDPValidationError`.

Without an egress guard, jose uses the global `fetch`, which the test preload replaces with happy-dom's; tests that verify a logout token therefore pass a guard that allows `localhost`.
