import { describe, expect, test } from 'bun:test'
import { tokenSetToSessionState } from '../../../../src/model/service/idp/providers/OIDCHelpers.js'

// revalidateOIDC itself is pinned over real HTTP in ../oidcHarness (sessionRevalidation, errorClassification)
describe('tokenSetToSessionState', () => {
	test('captures only present tokens and converts expiry to a Date', () => {
		const state = tokenSetToSessionState({ refresh_token: 'r', expires_at: 1000 }, 'sid-2')
		expect(state).toEqual({
			sessionId: 'sid-2',
			tokens: { refresh_token: 'r' },
			expiresAt: new Date(1000 * 1000),
		})
	})

	test('falls back to previous refresh/id tokens when the new token set omits them', () => {
		const state = tokenSetToSessionState(
			{ access_token: 'a-new', expires_at: 1000 },
			'sid-3',
			{ refresh_token: 'r-old', id_token: 'i-old', access_token: 'a-old' },
		)
		expect(state.tokens).toEqual({ refresh_token: 'r-old', id_token: 'i-old', access_token: 'a-new' })
	})

	test('prefers the new tokens over the previous ones when both are present', () => {
		const state = tokenSetToSessionState(
			{ refresh_token: 'r-new', access_token: 'a-new' },
			'sid-4',
			{ refresh_token: 'r-old' },
		)
		expect(state.tokens?.refresh_token).toBe('r-new')
	})
})
