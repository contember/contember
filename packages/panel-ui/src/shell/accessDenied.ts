import { GraphQlClientError } from '@contember/graphql-client'

/**
 * Detects the engine's panel gate rejecting an authenticated identity.
 *
 * The gate answers HTTP 403, which `GraphQlClient` maps to `type: 'forbidden'` while dropping the
 * response body — the server's `PANEL_ACCESS_DENIED` code never reaches the browser, so the status
 * is the whole signal. It is unambiguous under `/panel/api`, because the APIs mounted there never
 * answer 403 themselves: their permission failures are HTTP 200 with `extensions.code =
 * 'ForbiddenError'` (what `isForbiddenError` from `@contember/react-client-tenant` matches). Those
 * are an ordinary in-module state and must not be treated as a panel denial.
 *
 * If the gate ever gains a more specific signal, this is the one line to change.
 */
export const isPanelAccessDenied = (error: unknown): boolean => error instanceof GraphQlClientError && error.type === 'forbidden'
