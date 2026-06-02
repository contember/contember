import { expect, test } from 'bun:test'
import supertest from 'supertest'
import { apiUrl, rootToken } from '../../src/tester.js'

const meQuery = `query { me { id } }`
const invalidToken = 'invalidtoken0000000000000000000000000000000000000000'

// X-Contember-Force-Ok lets clients opt in to receiving HTTP 200 even on auth failure,
// keeping the error information in the JSON body. Some GraphQL clients cannot handle
// non-200 status codes. See issue #398.
//
// Note: the kill-switch (http.responseStatusHeader: false) cannot be exercised here — the
// e2e engine runs with a single, default (enabled) config. That path is covered by the
// shouldForceHttpOk unit tests in packages/engine-http.

test('auth failure returns 401 by default (no force-ok header)', async () => {
	const resp = await supertest(apiUrl)
		.post('/tenant')
		.set('Authorization', 'Bearer ' + invalidToken)
		.send({ query: meQuery })
	expect(resp.status).toBe(401)
})

test('X-Contember-Force-Ok coerces auth failure to HTTP 200 with errors in body', async () => {
	const resp = await supertest(apiUrl)
		.post('/tenant')
		.set('Authorization', 'Bearer ' + invalidToken)
		.set('X-Contember-Force-Ok', 'true')
		.send({ query: meQuery })
	expect(resp.status).toBe(200)
	expect(resp.headers['x-contember-original-status']).toBe('401')
	// error information is preserved in the JSON body
	expect(Array.isArray(resp.body.errors)).toBe(true)
})

test('X-Contember-Force-Ok=false (falsy) does not coerce an auth failure', async () => {
	const resp = await supertest(apiUrl)
		.post('/tenant')
		.set('Authorization', 'Bearer ' + invalidToken)
		.set('X-Contember-Force-Ok', 'false')
		.send({ query: meQuery })
	expect(resp.status).toBe(401)
	expect(resp.headers['x-contember-original-status']).toBeUndefined()
})

test('X-Contember-Force-Ok leaves a genuine 200 success untouched (no original-status header)', async () => {
	const resp = await supertest(apiUrl)
		.post('/tenant')
		.set('Authorization', 'Bearer ' + rootToken)
		.set('X-Contember-Force-Ok', 'true')
		.send({ query: meQuery })
	expect(resp.status).toBe(200)
	// a real success must not be tagged as coerced
	expect(resp.headers['x-contember-original-status']).toBeUndefined()
	expect(resp.body.data?.me?.id).toBeDefined()
})

test('X-Contember-Force-Ok coerces auth failure on the system API', async () => {
	const resp = await supertest(apiUrl)
		.post('/system/nonexistent')
		.set('Authorization', 'Bearer ' + invalidToken)
		.set('X-Contember-Force-Ok', 'true')
		.send({ query: `query { stages { id } }` })
	expect(resp.status).toBe(200)
	expect(resp.headers['x-contember-original-status']).toBe('401')
})

test('X-Contember-Force-Ok coerces auth failure on the content API', async () => {
	const resp = await supertest(apiUrl)
		.post('/content/nonexistent/live')
		.set('Authorization', 'Bearer ' + invalidToken)
		.set('X-Contember-Force-Ok', 'true')
		.send({ query: `query { __typename }` })
	expect(resp.status).toBe(200)
	expect(resp.headers['x-contember-original-status']).toBe('401')
})
