# OIDC fake IdP harness

`FakeIdp.ts` is a fake OpenID Connect provider served over real HTTP on a random port: discovery, JWKS, authorization, token, userinfo, introspection and end-session endpoints, with an in-memory store of codes and tokens. It records every request (`requests`, `clientAuth`), takes per-endpoint failure overrides (`override(endpoint, …)`), and supports issuer quirks (`basePath`, `issuer`, `idTokenIssuer`, `idTokenClaims`, `endpointHosts`). It does not depend on `openid-client`.

The tests here drive `OIDCProvider` through its public methods only (`initAuth`, `processResponse`, `revalidate`, `buildLogoutUrl`, `validateLogoutToken`) and pin today's behaviour on openid-client 6.9. They were written against 5.7.1; the 6 upgrade kept that behaviour where it could and changed the tests only for a decided deviation (listed in its PR). After a library upgrade, a failing test here is a behaviour change to decide on, not a test to update.

| File | Pins |
|---|---|
| `responseTypes.test.ts` | every stored `responseType` with and without `strictResponseType`: authorization URL, response mode, which endpoints the callback calls, the normalized response; escalated response types; `form_post`; the URL callback form |
| `clientAuthentication.test.ts` | the default `client_secret_basic` (and its exact encoding), `client_secret_post`, `client_secret_jwt`, `none`, on the token and introspection endpoints |
| `egressGuard.test.ts` | every outbound request passes the egress guard (discovery, token, ID-token and logout-token JWKS, userinfo, refresh, introspection): the fake is served as the allow-listed `127.0.0.2`, and an endpoint moved to `localhost` must be refused by the guard's lookup. Linux only out of the box, where all of 127.0.0.0/8 is loopback; on macOS add the address first (`sudo ifconfig lo0 alias 127.0.0.2`) |
| `errorClassification.test.ts` | which IdP failures revoke a session and which propagate as transient, and the sign-in error classes |
| `sessionRevalidation.test.ts` | the session captured at sign-in, what a refresh or userinfo revalidation stores, and the RP-initiated logout URL (`null` without an `end_session_endpoint`) |
| `issuerQuirks.test.ts` | realm paths, trailing slashes, an issuer unrelated to the discovery URL, a `{tenantid}` template outside Microsoft |
| `fixedHosts.test.ts` | the providers on a fixed host: Entra ID multi-tenant `{tenantid}` substitution on `login.microsoftonline.com`, Apple's ES256 client secret, Facebook's static issuer metadata. `useFetchRoutes` reroutes the global `fetch` from the fixed origin to the fake |

Behaviour an upgrade is likely to change, each pinned by a test:

- Discovery does not compare the advertised `issuer` with the configured URL: a trailing-slash mismatch or an unrelated issuer is accepted. openid-client 6 compares it unless it is handed the document URL, which `discoveryTarget` does.
- `{tenantid}` is substituted from the token's `tid` only for the Microsoft multi-tenant discovery URLs (`https://login.microsoftonline.com/{common,organizations,consumers}/…`); anywhere else the template is compared literally. openid-client 6 substitutes only when it discovered from the issuer URL itself, so `discoveryTarget` hands it that form for exactly those paths.
- `client_secret_basic` leaves `- _ . ! ~ * ' ( )` unencoded, and is the default unless the IdP advertises only `client_secret_post`; openid-client 6 defaults to `client_secret_post` and encodes those characters. The `client_secret_jwt` assertion's `aud` is the issuer.
- The ID token from the token endpoint has its signature verified (`enableNonRepudiationChecks`); openid-client 6 skips it by default.
- A request timeout is a `ClientError` (`OAUTH_TIMEOUT`): transient on revalidation, but an `IDPValidationError` at sign-in.
- `responseType: 'none'` cannot complete a sign-in (`IDPValidationError`: no authorization code).
- Only the authorization-response parameters (`code`, `id_token`, `access_token`, `token_type`, `expires_in`, `state`, `iss`, `session_state`, `error*`) are read from a callback, and an empty one counts as absent; anything else a user appends never reaches the response or the claim mapping. An implicit `expires_in` cannot outlast the ID token.
- A refresh or userinfo failure revokes the session when its OAuth error code is `invalid_grant`, `invalid_token` or `expired_token`, wherever the IdP put it: the JSON body of a 4xx, a `WWW-Authenticate` challenge, or both. A 5xx is transient whatever its body says.
- For a response type with a code, `initAuth` refuses a `redirectUrl` that is not in normalized form or carries a query or fragment: the token request would send a different `redirect_uri`.
- Introspection revokes a session only on `active: false`; every error response, `400 invalid_token` included, is thrown and keeps the session.
- The logout-token JWKS is fetched by jose (the guard's `fetch`, or the global `fetch` without a guard), separately from openid-client's ID-token JWKS; a refused fetch surfaces as `IDPValidationError`.

The test preload registers happy-dom globally. Its `fetch` enforces the browser's same-origin policy, and openid-client's `instanceof` checks fail between its `URL`, `Response` and `DOMException` and the runtime's, so every file here calls `useRuntimeGlobals()`, which lifts happy-dom for the file's tests.
