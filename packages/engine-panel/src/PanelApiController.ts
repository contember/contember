import type { IncomingHttpHeaders } from 'node:http'
import type { AuthResult, HttpContext, HttpController, ProjectGroupContainer } from '@contember/engine-http'
import { HttpErrorResponse } from '@contember/engine-http'

/**
 * Decides whether a signed-in identity may use the management panel. This is an entry gate for the
 * console, not an authorization system — every API the panel calls still enforces the tenant ACL.
 */
export interface PanelAccessCheck {
	isAllowed(args: { projectGroup: ProjectGroupContainer; authResult: AuthResult }): Promise<boolean>
}

export interface PanelApiControllerOptions {
	/**
	 * Whether a request carrying no credentials may be authenticated with the group's login token.
	 * Only the tenant mount has a pre-sign-in caller (the login screen); content and system do not,
	 * so they answer 401 rather than widening the anonymous surface for nobody.
	 */
	allowAnonymous: boolean
}

/**
 * Wraps an API controller (tenant / content / system) for the panel's own `/panel/api/*` mount.
 *
 * Two things happen here that do not happen on the public routes:
 *
 *  1. **Anonymous calls are authenticated with the group's login token.** The panel's sign-in screen
 *     has no credentials of its own, and shipping the login token to the browser — which is what
 *     every Contember admin app does today — would publish it. Injecting it server-side exposes
 *     exactly the same operations to an unauthenticated caller as a leaked token would, with nothing
 *     to leak. Restricted to same-origin callers, see {@link isCrossOrigin}.
 *  2. **The access gate runs.** Anything the caller authenticated itself is checked against the
 *     configured panel policy before it reaches the API.
 */
export class PanelApiControllerFactory {
	constructor(private readonly access: PanelAccessCheck) {}

	public create(inner: HttpController, { allowAnonymous }: PanelApiControllerOptions): HttpController {
		return async ctx => {
			if (ctx.authResult) {
				// The caller presented its own credentials, so the panel gate applies.
				if (!await this.access.isAllowed({ projectGroup: ctx.projectGroup, authResult: ctx.authResult })) {
					return accessDeniedResponse()
				}
				return await inner(ctx)
			}
			if (!allowAnonymous) {
				return new HttpErrorResponse(401, 'Authentication required')
			}
			if (isCrossOrigin(ctx.request.headers)) {
				return crossOriginDeniedResponse()
			}
			const authResult = await this.authenticateWithLoginToken(ctx)
			if (!authResult) {
				return new HttpErrorResponse(401, 'Authentication required')
			}
			// Nothing to gate yet: this is the pre-sign-in panel, not an identity.
			return await inner({ ...ctx, authResult })
		}
	}

	private async authenticateWithLoginToken(ctx: HttpContext): Promise<AuthResult | null> {
		const loginToken = ctx.projectGroup.loginToken
		if (loginToken === undefined) {
			return null
		}
		return await ctx.projectGroup.authenticator.authenticate({
			request: ctx.request,
			timer: ctx.timer,
			clientIp: ctx.clientIp,
			fallbackToken: loginToken,
		})
	}
}

/**
 * The anonymous path needs no credentials, so the app-wide `Access-Control-Allow-Origin: *` would
 * otherwise let any page drive the login-token operations (sign-in, password reset, magic links)
 * from a visitor's browser — spreading the per-IP rate limits across those visitors' addresses. The
 * panel is served from this origin, so a legitimate anonymous call is always same-origin.
 *
 * Only requests that prove they are cross-origin are rejected. A non-browser client sends neither
 * header and is not the vector anyway: it spends its own IP and meets the rate limit normally.
 */
const isCrossOrigin = (headers: IncomingHttpHeaders): boolean => {
	const secFetchSite = headerValue(headers['sec-fetch-site'])
	if (secFetchSite !== undefined) {
		return secFetchSite !== 'same-origin' && secFetchSite !== 'none'
	}
	const origin = headerValue(headers['origin'])
	if (origin === undefined) {
		return false
	}
	try {
		return new URL(origin).host !== headerValue(headers['host'])
	} catch {
		return true
	}
}

const headerValue = (header: string | string[] | undefined): string | undefined => Array.isArray(header) ? header[0] : header

const crossOriginDeniedResponse = (): HttpErrorResponse =>
	new HttpErrorResponse(403, 'PANEL_CROSS_ORIGIN_DENIED: the panel API accepts anonymous calls from its own origin only.')

/**
 * 403 rather than a GraphQL error, so the panel can tell "you may not be here" apart from "you may
 * not see this particular thing" (which the APIs report as a 200 with a `ForbiddenError` extension).
 * `GraphQlClient` drops the body of a 403, so the message is for operators reading logs — the
 * browser client only ever sees the status.
 */
export const accessDeniedResponse = (): HttpErrorResponse =>
	new HttpErrorResponse(403, 'PANEL_ACCESS_DENIED: this identity is not allowed to use the management panel.')
