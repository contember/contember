import type { IncomingHttpHeaders } from 'node:http'
import type { AuthResult, HttpController, ProjectGroupContainer } from '@contember/engine-http'
import { createUnpersistedLoginVerifyResult, HttpErrorResponse } from '@contember/engine-http'

/**
 * Decides whether a signed-in identity may use the management panel. This is an entry gate for the
 * console, not an authorization system — every API the panel calls still enforces the tenant ACL.
 */
export interface PanelAccessCheck {
	isAllowed(args: { projectGroup: ProjectGroupContainer; authResult: AuthResult }): Promise<boolean>
}

export interface PanelApiControllerOptions {
	/**
	 * Whether a request carrying no credentials may act as the virtual `login` identity. Only the
	 * tenant mount has a pre-sign-in caller (the login screen); content and system do not, so they
	 * answer 401 rather than widening the anonymous surface for nobody.
	 */
	allowAnonymous: boolean
}

/**
 * Wraps an API controller (tenant / content / system) for the panel's own `/panel/api/*` mount.
 *
 * Two things happen here that do not happen on the public routes:
 *
 *  1. **Anonymous calls act as a virtual `login` identity.** The panel's sign-in screen has no
 *     credentials of its own, and shipping a login token to the browser — which is what every
 *     Contember admin app does today — would publish it. Instead the caller is given
 *     `createUnpersistedLoginVerifyResult()`: no token exists anywhere, no `api_key` row is read or
 *     written, and the roles are pinned in code, so a misconfigured `CONTEMBER_LOGIN_TOKEN` cannot
 *     turn this into anything but `login`. Browser requests must be same-origin; direct clients can
 *     reproduce the required headers. See {@link isSameOriginBrowser}.
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
			if (!isSameOriginBrowser(ctx.request.headers)) {
				return crossOriginDeniedResponse()
			}
			const authResult = await ctx.projectGroup.authenticator.authenticate({
				request: ctx.request,
				timer: ctx.timer,
				clientIp: ctx.clientIp,
				fallbackIdentity: createUnpersistedLoginVerifyResult(),
			})
			if (!authResult) {
				return new HttpErrorResponse(401, 'Authentication required')
			}
			// Nothing to gate yet: this is the pre-sign-in panel, not an identity.
			return await inner({ ...ctx, authResult })
		}
	}
}

/**
 * Whether the request carries same-origin browser signals. This is a CSRF check, not client
 * authentication: a direct client can reproduce these headers.
 *
 * A cross-origin page is kept out: the app-wide CORS headers would otherwise let any site drive
 * sign-in, password reset and magic links from a visitor's browser, spreading the per-IP rate limits
 * across those visitors' addresses. Rate limits remain the protection against direct abuse.
 *
 * A browser signal is required. Current browsers send `Sec-Fetch-Site`; older browsers send `Origin`
 * on a POST, including a same-origin one.
 */
const isSameOriginBrowser = (headers: IncomingHttpHeaders): boolean => {
	const secFetchSite = headerValue(headers['sec-fetch-site'])
	if (secFetchSite !== undefined) {
		// `none` is a user-initiated navigation (typed URL, bookmark); `fetch` never produces it.
		return secFetchSite === 'same-origin' || secFetchSite === 'none'
	}
	const origin = headerValue(headers['origin'])
	if (origin === undefined) {
		return false
	}
	const host = headerValue(headers['host'])
	try {
		// Hostname, not host: a TLS-terminating proxy commonly rewrites the port into `Host`, and the
		// port is not what this check is defending.
		return host !== undefined && new URL(origin).hostname === new URL(`http://${host}`).hostname
	} catch {
		return false
	}
}

const headerValue = (header: string | string[] | undefined): string | undefined => Array.isArray(header) ? header[0] : header

const crossOriginDeniedResponse = (): HttpErrorResponse =>
	new HttpErrorResponse(403, 'PANEL_CROSS_ORIGIN_DENIED: the panel API accepts anonymous calls from its own origin only.')

/**
 * Names the gate as the source of a 403, because the status alone does not: the system API answers
 * 403 for a project the caller is not a member of when the server runs in debug mode, and the content
 * API does the same for a rejected `assumeMembership`. Without this header the panel would read either
 * of those as "you may not be here" and throw the whole session away.
 *
 * `GraphQlClient` drops the body of a 403 but keeps the `Response`, so a header is what reaches the
 * client. The panel is served from this origin, so it is readable without `Access-Control-Expose-Headers`.
 * The client half is `isPanelAccessDenied` in `panel-ui/src/shell/accessDenied.ts`.
 */
export const panelErrorHeader = 'X-Contember-Panel-Error'

/**
 * 403 rather than a GraphQL error, so the panel can tell "you may not be here" apart from "you may
 * not see this particular thing" (which the APIs report as a 200 with a `ForbiddenError` extension).
 * The message is for operators reading logs; the browser acts on {@link panelErrorHeader}.
 */
export const accessDeniedResponse = (): HttpErrorResponse =>
	new HttpErrorResponse(403, 'PANEL_ACCESS_DENIED: this identity is not allowed to use the management panel.', {
		[panelErrorHeader]: 'PANEL_ACCESS_DENIED',
	})
