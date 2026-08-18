import { expect, test } from 'bun:test'
import supertest from 'supertest'
import { apiUrl } from '../src/tester.js'

test('serves the management panel shell', async () => {
	const response = await supertest(apiUrl)
		.get('/panel')
		.expect(200)
		.expect('Content-Type', /text\/html/)

	expect(response.text).toContain('<base href="/panel/">')
	expect(response.text).toContain('"apiBaseUrl":"/panel/api"')
	expect(response.text).not.toContain('__CONTEMBER_PANEL_')
})

test('serves the shell for a client-side route', async () => {
	await supertest(apiUrl)
		.get('/panel/p/some-project/members')
		.expect(200)
		.expect('Content-Type', /text\/html/)
})

test('serves the assets the shell references', async () => {
	const shell = await supertest(apiUrl).get('/panel').expect(200)
	const src = shell.text.match(/<script type="module" [^>]*src="\.\/([^"]+)"/)?.[1]
	expect(src).toBeDefined()

	await supertest(apiUrl)
		.get(`/panel/${src}`)
		.expect(200)
		.expect('Content-Type', /javascript/)
		.expect('Cache-Control', 'public, max-age=31536000, immutable')
})

test('rejects a write to the panel', async () => {
	await supertest(apiUrl)
		.post('/panel')
		.expect(405)
})
