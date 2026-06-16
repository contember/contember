import { HttpController } from '../application/index.js'
import { HttpErrorResponse, HttpResponse } from '../common/index.js'

/**
 * OIDC Back-Channel Logout endpoint (`/oidc/backchannel-logout`, A10).
 *
 * The IdP POSTs a signed `logout_token` (form-encoded, per OIDC Back-Channel Logout 1.0) when a
 * federated user signs out centrally. The request is unauthenticated (it comes from the IdP, not a
 * browser session), so this route does NOT require an `authResult`. Because a back-channel request
 * carries no Contember context, the target identity provider is selected with a `?provider=<slug>`
 * query param (configured into the IdP's logout endpoint at registration time); the tenant itself is
 * still resolved the usual way (domain / config header) by the application layer.
 *
 * Responses follow the spec: 200 on success, 400 on a malformed/invalid token, 501 when the IdP type
 * does not support back-channel logout. Per spec, `Cache-Control: no-store` is always set.
 */
export class OidcBackchannelLogoutMiddlewareFactory {
	create(): HttpController {
		return async ctx => {
			const { projectGroup, koa, url } = ctx
			koa.response.set('Cache-Control', 'no-store')

			if (koa.request.method !== 'POST') {
				return new HttpErrorResponse(405, 'Method not allowed')
			}

			const providerSlug = url.searchParams.get('provider')
			if (!providerSlug) {
				return new HttpErrorResponse(400, 'Missing "provider" query parameter')
			}

			const body = koa.request.body
			const logoutToken = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).logout_token : undefined
			if (typeof logoutToken !== 'string' || logoutToken === '') {
				return new HttpErrorResponse(400, 'Missing "logout_token"')
			}

			const tenantContainer = projectGroup.tenantContainer
			const result = await tenantContainer.backchannelLogoutManager.logout(
				tenantContainer.databaseContext,
				providerSlug,
				logoutToken,
			)

			switch (result.status) {
				case 'ok':
					return new HttpResponse(200, JSON.stringify({ ok: true, revoked: result.revokedCount }), 'application/json')
				case 'provider_not_found':
					return new HttpErrorResponse(404, `Identity provider "${providerSlug}" not found`)
				case 'not_supported':
					return new HttpErrorResponse(501, 'Identity provider does not support back-channel logout')
				case 'invalid_token':
					return new HttpErrorResponse(400, result.message)
				default: {
					// Exhaustiveness guard: if BackchannelLogoutResult grows a variant, this stops
					// compiling rather than silently falling through and returning no response to the IdP.
					const unexpected: never = result
					return new HttpErrorResponse(500, `Unexpected back-channel logout result: ${JSON.stringify(unexpected)}`)
				}
			}
		}
	}
}
