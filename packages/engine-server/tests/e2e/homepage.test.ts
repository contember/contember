import { test } from 'vitest'
import supertest from 'supertest'
import { apiUrl } from '../src/tester.js'

test('show homepage', async () => {
	await supertest(apiUrl)
		.get('/')
		.expect(200)
		.expect('App is running')
})
