import type { AuthResult, HttpContext, HttpController, ProjectGroupContainer } from '@contember/engine-http'
import { HttpErrorResponse } from '@contember/engine-http'

/**
 * Decides whether a signed-in identity may use the management panel. This is an entry gate for the
 * console, not an authorization system — every API the panel calls still enforces the tenant ACL.
 */
export interface PanelAccessCheck {
	isAllowed(args: { projectGroup: ProjectGroupContainer; authResult: AuthResult }): Promise<boolean>
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
 *     to leak.
 *  2. **The access gate runs.** Anything the caller authenticated itself is checked against the
 *     configured panel policy before it reaches the API.
 */
export class PanelApiControllerFactory {
	constructor(private readonly access: PanelAccessCheck) {}

	public create(inner: HttpController): HttpController {
		return async ctx => {
			const { authResult, anonymous } = await this.resolveAuth(ctx)
			if (!authResult) {
				return new HttpErrorResponse(401, 'Authentication required')
			}
			// The gate applies to callers that presented their own credentials. A request we
			// authenticated ourselves is the pre-sign-in panel, which has nothing to gate yet.
			if (!anonymous && !await this.access.isAllowed({ projectGroup: ctx.projectGroup, authResult })) {
				return accessDeniedResponse()
			}
			return await inner({ ...ctx, authResult })
		}
	}

	private async resolveAuth(ctx: HttpContext): Promise<{ authResult: AuthResult | null; anonymous: boolean }> {
		if (ctx.authResult) {
			return { authResult: ctx.authResult, anonymous: false }
		}
		const loginToken = ctx.projectGroup.loginToken
		if (loginToken === undefined) {
			return { authResult: null, anonymous: false }
		}
		const authResult = await ctx.projectGroup.authenticator.authenticate({
			request: ctx.request,
			timer: ctx.timer,
			clientIp: ctx.clientIp,
			fallbackToken: loginToken,
		})
		return { authResult, anonymous: authResult !== null }
	}
}

/**
 * 403 rather than a GraphQL error, so the panel can tell "you may not be here" apart from "you may
 * not see this particular thing" (which the APIs report as a 200 with a `ForbiddenError` extension).
 * `GraphQlClient` drops the body of a 403, so the message is for operators reading logs — the
 * browser client only ever sees the status.
 */
export const accessDeniedResponse = (): HttpErrorResponse =>
	new HttpErrorResponse(403, 'PANEL_ACCESS_DENIED: this identity is not allowed to use the management panel.')
