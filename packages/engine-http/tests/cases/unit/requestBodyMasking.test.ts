import { describe, expect, test } from 'bun:test'
import { maskRequestBody, maskRequestUri } from '../../../src/application/requestBodyMasking.js'

describe('maskRequestBody', () => {
	test('masks a variable passed to a secret argument, whatever its name', () => {
		const query = 'mutation($e: String!, $p: String!) { signIn(email: $e, password: $p) { ok } }'
		expect(maskRequestBody({ query, variables: { e: 'john@example.com', p: 'secret-password' } }, true)).toEqual({
			query,
			variables: { e: 'john@example.com', p: '[redacted]' },
		})
	})

	test('masks secret literals inlined in the query and keeps the rest', () => {
		const masked = maskRequestBody({
			query: 'mutation { signInPasswordless(requestId: "request-1", token: "link-token", mfaOtp: "123456") { ok } }',
		}, true)
		expect(masked).toEqual({
			query: 'mutation {\n  signInPasswordless(\n    requestId: "request-1"\n    token: "[redacted]"\n    mfaOtp: "[redacted]"\n  ) {\n    ok\n  }\n}',
		})
	})

	test('masks secret fields inside input objects, inline and as variables', () => {
		const query = 'mutation($config: Json!) { addIDP(identityProvider: "sso", type: "oidc", configuration: $config) { ok } }'
		expect(maskRequestBody({ query, variables: { config: { clientId: 'client', clientSecret: 'client-secret' } } }, true)).toEqual({
			query,
			variables: { config: { clientId: 'client', clientSecret: '[redacted]' } },
		})
		const inline = maskRequestBody({
			query: 'mutation { updateIDP(identityProvider: "sso", configuration: { clientSecret: "client-secret" }) { ok } }',
		}, true)
		expect(JSON.stringify(inline)).not.toContain('client-secret')
	})

	test('masks the value of a project secret, which is secret only on that field', () => {
		const query = 'mutation($v: String!) { setProjectSecret(projectSlug: "blog", key: "s3.secret", value: $v) { ok } }'
		expect(maskRequestBody({ query, variables: { v: 's3-secret-value' } }, true)).toEqual({ query, variables: { v: '[redacted]' } })
		const inline = maskRequestBody(
			{ query: 'mutation { setProjectSecret(projectSlug: "blog", key: "s3.secret", value: "s3-secret-value") { ok } }' },
			true,
		)
		expect(JSON.stringify(inline)).not.toContain('s3-secret-value')
		const other = 'query { configuration { value } }'
		expect(maskRequestBody({ query: other }, true)).toEqual({ query: other })
	})

	test('masks every string of a secret list', () => {
		const query = 'mutation($secrets: [ProjectSecret!]) { createProject(projectSlug: "blog", secrets: $secrets) { ok } }'
		expect(maskRequestBody({ query, variables: { secrets: [{ key: 'db.password', value: 'db-secret' }] } }, true)).toEqual({
			query,
			variables: { secrets: [{ key: '[redacted]', value: '[redacted]' }] },
		})
	})

	test('replaces a query it cannot parse when it may inline a secret', () => {
		expect(maskRequestBody({ query: 'mutation { signIn(password: "secret-password" ' }, true)).toEqual({ query: '[redacted]' })
	})

	test('masks secret keys of a body that is not a GraphQL request', () => {
		expect(maskRequestBody({ token: 'abc', name: 'x' }, true)).toEqual({ token: '[redacted]', name: 'x' })
		expect(maskRequestBody(undefined, true)).toBeUndefined()
	})

	test('masks the default value of a variable bound to a secret argument', () => {
		const masked = maskRequestBody({ query: 'mutation($p: String = "default-secret") { signIn(email: "a", password: $p) { ok } }' }, true)
		expect(JSON.stringify(masked)).not.toContain('default-secret')
	})

	test('masks every variable when the query naming a secret cannot be parsed', () => {
		const body = { query: 'mutation($p: String!) { signIn(email: "a", password: $p) { ok }', variables: { p: 'secret-password' } }
		expect(maskRequestBody(body, true)).toEqual({ query: '[redacted]', variables: { p: '[redacted]' } })
	})

	test('masks the IdP callback data, inline and as a variable', () => {
		const query = 'mutation($d: Json) { signInIDP(identityProvider: "sso", data: $d) { ok } }'
		const data = { url: 'https://app/cb?code=AUTHCODE', parameters: { id_token: 'IDTOKEN' }, redirectUrl: 'https://app/cb' }
		expect(JSON.stringify(maskRequestBody({ query, variables: { d: data } }, true))).not.toMatch(/AUTHCODE|IDTOKEN/)
		const inline = maskRequestBody({
			query: 'mutation { signInIDP(identityProvider: "sso", idpResponse: { url: "https://app/cb?code=AUTHCODE" }) { ok } }',
		}, true)
		expect(JSON.stringify(inline)).not.toContain('AUTHCODE')
	})

	test('masks actions variables', () => {
		const query = 'mutation($a: [VariableInput!]!) { setVariables(args: $a) { ok } }'
		expect(maskRequestBody({ query, variables: { a: [{ name: 'webhookToken', value: 'hook-secret' }] } }, true)).toEqual({
			query,
			variables: { a: [{ name: '[redacted]', value: '[redacted]' }] },
		})
	})

	test('masks a GraphQL request sent as a query string, whose variables are a JSON string', () => {
		const query = { query: 'mutation($p: String!) { signIn(email: "a", password: $p) { ok } }', variables: '{"p":"secret-password"}' }
		expect(JSON.stringify(maskRequestBody(query, true))).not.toContain('secret-password')
		expect(maskRequestUri('/tenant?query=mutation&variables=x', true)).toBe('/tenant?[redacted]')
		expect(maskRequestUri('/content/blog/live?x=1', false)).toBe('/content/blog/live?x=1')
	})

	test('leaves the project data of routes without credentials as sent', () => {
		const body = { query: 'query { listProduct(filter: { code: { eq: "PROD-1" } }) { token } }' }
		expect(maskRequestBody(body, false)).toBe(body)
	})
})
