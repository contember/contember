import { describe, expect, test } from 'bun:test'
import { liftNestedClaims } from '../../../../src/model/service/idp/providers/OIDCHelpers.js'

// liftNestedClaims is the SHARED claim-normalization used by BOTH the OIDC sign-in response handler
// (handleOIDCResponse) and the session-refresh path (revalidateOIDC), so an `attributesKey` provider —
// notably Apereo CAS, which nests its claims under `attributes` — resolves its A09 claim mapping
// identically at sign-in and on refresh (SEC-2).
describe('liftNestedClaims', () => {
	test('no attributesKey → source returned unchanged (same reference)', () => {
		const source = { sub: '1', groups: ['a'] }
		expect(liftNestedClaims(source, undefined)).toBe(source)
	})

	test('lifts a nested attributes object to the top level', () => {
		expect(liftNestedClaims({ sub: '1', attributes: { department: 'Editorial', groups: ['IT'] } }, 'attributes'))
			.toEqual({ sub: '1', department: 'Editorial', groups: ['IT'], attributes: { department: 'Editorial', groups: ['IT'] } })
	})

	test('a signed top-level claim keeps precedence over an attributes-level value of the same name', () => {
		// nested attributes are UNSIGNED → spread UNDER source, so the top-level (verified) value wins
		expect(liftNestedClaims({ sub: 'signed', attributes: { sub: 'spoofed' } }, 'attributes').sub).toBe('signed')
	})

	test('a non-object / array / missing attributesKey value is a no-op', () => {
		expect(liftNestedClaims({ sub: '1', attributes: 'x' }, 'attributes')).toEqual({ sub: '1', attributes: 'x' })
		expect(liftNestedClaims({ sub: '1', attributes: ['x'] }, 'attributes')).toEqual({ sub: '1', attributes: ['x'] })
		expect(liftNestedClaims({ sub: '1' }, 'attributes')).toEqual({ sub: '1' })
	})
})
