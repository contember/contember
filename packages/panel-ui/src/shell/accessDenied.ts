import { GraphQlClientError } from '@contember/graphql-client'

/**
 * Header the engine's panel gate names itself with, and the code it sends. Mirrors `panelErrorHeader`
 * in `engine-panel/src/PanelApiController.ts` — a wire constant, so the two must stay in step.
 */
const panelErrorHeader = 'X-Contember-Panel-Error'
const accessDeniedCode = 'PANEL_ACCESS_DENIED'

/**
 * Detects the engine's panel gate rejecting an authenticated identity.
 *
 * Matching on the bare 403 is not enough, because the APIs mounted under `/panel/api` do answer 403
 * themselves: `SystemApiMiddlewareFactory` for a project the caller is not a member of when the server
 * runs in debug mode, and `ProjectMembershipResolver` for a rejected `assumeMembership`. Both are an
 * ordinary in-module state, and treating either as a panel denial would swap the whole UI for the
 * denial screen and sign the user out.
 *
 * An in-module permission failure never looks like this either: a `ForbiddenError` is a `GraphQLError`,
 * so `processErrors` in `engine-http/src/graphql/execution.ts` grades it 400 — or leaves it at 200
 * where the field is nullable and `data` survives — always carrying `extensions.code = 'ForbiddenError'`
 * (what `isForbiddenError` from `@contember/react-client-tenant` matches).
 */
export const isPanelAccessDenied = (error: unknown): boolean =>
	error instanceof GraphQlClientError
	&& error.type === 'forbidden'
	&& error.response?.headers.get(panelErrorHeader) === accessDeniedCode
