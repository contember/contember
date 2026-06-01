import { expect, test } from 'bun:test'
import supertest from 'supertest'
import { apiUrl } from '../../src/tester'

const meQuery = `query { me { id } }`

// X-Contember-Force-Ok lets clients opt in to receiving HTTP 200 even on auth failure,
// keeping the error information in the JSON body. Some GraphQL clients cannot handle
// non-200 status codes. See issue #398.

test('auth failure returns 401 by default (no force-ok header)', async () => {
	const resp = await supertest(apiUrl)
		.post('/tenant')
		.set('Authorization', 'Bearer invalidtoken0000000000000000000000000000000000000000')
		.send({ query: meQuery })
	expect(resp.status).toBe(401)
})

test('X-Contember-Force-Ok coerces auth failure to HTTP 200 with errors in body', async () => {
	const resp = await supertest(apiUrl)
		.post('/tenant')
		.set('Authorization', 'Bearer invalidtoken0000000000000000000000000000000000000000')
		.set('X-Contember-Force-Ok', 'true')
		.send({ query: meQuery })
	expect(resp.status).toBe(200)
	expect(resp.headers['x-contember-original-status']).toBe('401')
	// error information is preserved in the JSON body
	expect(Array.isArray(resp.body.errors)).toBe(true)
})

test('X-Contember-Force-Ok leaves successful responses untouched', async () => {
	const resp = await supertest(apiUrl)
		.post('/tenant')
		.set('Authorization', 'Bearer invalidtoken0000000000000000000000000000000000000000')
		.set('X-Contember-Force-Ok', 'false')
		.send({ query: meQuery })
	expect(resp.status).toBe(401)
})
