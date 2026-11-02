import { afterEach, describe, expect, setSystemTime, test } from 'bun:test'
import { base64url } from 'jose'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { githubActions, kubernetes } from '../../../src/index.js'

const request = { url: 'https://api.example.com/content/web/live', method: 'POST', refresh: false }

/** An unsigned JWT-shaped token; the sources read `iat` / `exp` without verifying. */
const fakeToken = (claims: Record<string, unknown>) =>
	`${base64url.encode(JSON.stringify({ alg: 'RS256' }))}.${base64url.encode(JSON.stringify(claims))}.signature`

const nowSeconds = () => Math.floor(Date.now() / 1000)

afterEach(() => {
	setSystemTime()
})

describe('githubActions', () => {
	const env = {
		ACTIONS_ID_TOKEN_REQUEST_URL: 'https://token.actions.example/request?api-version=2.0',
		ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'request-token',
	}

	const createFetch = () => {
		const calls: { url: string; headers: Headers }[] = []
		const fetch = async (url: string, init?: RequestInit) => {
			calls.push({ url, headers: new Headers(init?.headers) })
			const iat = nowSeconds()
			return Response.json({ value: fakeToken({ iat, exp: iat + 100, n: calls.length }) })
		}
		return { fetch, calls }
	}

	test('requests a token for the audience and sends it as a bearer token', async () => {
		const { fetch, calls } = createFetch()
		const provider = githubActions({ audience: 'contember:my instance:deploy', env, fetch })

		const headers = await provider.authenticate(request)

		expect(calls).toHaveLength(1)
		expect(calls[0].url).toBe('https://token.actions.example/request?api-version=2.0&audience=contember%3Amy%20instance%3Adeploy')
		expect(calls[0].headers.get('Authorization')).toBe('bearer request-token')
		expect(Object.keys(headers)).toEqual(['Authorization'])
		expect(headers.Authorization).toStartWith('Bearer ')
	})

	test('caches the token until 80 % of its lifetime and re-fetches on refresh', async () => {
		const start = new Date('2026-01-01T00:00:00Z')
		setSystemTime(start)
		const { fetch, calls } = createFetch()
		const provider = githubActions({ audience: 'aud', env, fetch })

		const first = await provider.authenticate(request)
		setSystemTime(new Date(start.getTime() + 79_000))
		expect(await provider.authenticate(request)).toEqual(first)
		expect(calls).toHaveLength(1)

		setSystemTime(new Date(start.getTime() + 81_000))
		const second = await provider.authenticate(request)
		expect(second).not.toEqual(first)
		expect(calls).toHaveLength(2)

		const third = await provider.authenticate({ ...request, refresh: true })
		expect(third).not.toEqual(second)
		expect(calls).toHaveLength(3)
	})

	test('concurrent requests share one token request', async () => {
		const { fetch, calls } = createFetch()
		const provider = githubActions({ audience: 'aud', env, fetch })

		const results = await Promise.all([provider.authenticate(request), provider.authenticate(request)])
		expect(results[0]).toEqual(results[1])
		expect(calls).toHaveLength(1)
	})

	test('fails clearly without the GitHub OIDC environment', () => {
		expect(() => githubActions({ audience: 'aud', env: {} })).toThrow('permissions: id-token: write')
		expect(() => githubActions({ audience: 'aud', env: { ACTIONS_ID_TOKEN_REQUEST_URL: env.ACTIONS_ID_TOKEN_REQUEST_URL } })).toThrow(
			'ACTIONS_ID_TOKEN_REQUEST_TOKEN',
		)
	})

	test('rejects a failed or malformed token response', async () => {
		const failing = githubActions({ audience: 'aud', env, fetch: async () => new Response('nope', { status: 403 }) })
		await expect(failing.authenticate(request)).rejects.toThrow('HTTP 403')

		const empty = githubActions({ audience: 'aud', env, fetch: async () => Response.json({ count: 1 }) })
		await expect(empty.authenticate(request)).rejects.toThrow('no `value`')

		const opaque = githubActions({ audience: 'aud', env, fetch: async () => Response.json({ value: 'opaque' }) })
		await expect(opaque.authenticate(request)).rejects.toThrow('not a JWT')
	})
})

describe('kubernetes', () => {
	test('reads and trims the token file, re-reads it on refresh and before expiry', async () => {
		const start = new Date('2026-01-01T00:00:00Z')
		setSystemTime(start)
		const directory = await mkdtemp(join(tmpdir(), 'workload-identity-'))
		const path = join(directory, 'token')
		try {
			const iat = nowSeconds()
			const first = fakeToken({ iat, exp: iat + 3600, n: 1 })
			await writeFile(path, `${first}\n`)
			const provider = kubernetes({ path })
			expect(await provider.authenticate(request)).toEqual({ Authorization: `Bearer ${first}` })

			const second = fakeToken({ iat, exp: iat + 3600, n: 2 })
			await writeFile(path, second)
			expect(await provider.authenticate(request)).toEqual({ Authorization: `Bearer ${first}` })
			expect(await provider.authenticate({ ...request, refresh: true })).toEqual({ Authorization: `Bearer ${second}` })

			const third = fakeToken({ iat, exp: iat + 3600, n: 3 })
			await writeFile(path, third)
			setSystemTime(new Date(start.getTime() + 2_881_000))
			expect(await provider.authenticate(request)).toEqual({ Authorization: `Bearer ${third}` })
		} finally {
			await rm(directory, { recursive: true, force: true })
		}
	})

	test('a missing or empty file fails', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'workload-identity-'))
		try {
			await expect(kubernetes({ path: join(directory, 'missing') }).authenticate(request)).rejects.toThrow('ENOENT')
			await writeFile(join(directory, 'empty'), '\n')
			await expect(kubernetes({ path: join(directory, 'empty') }).authenticate(request)).rejects.toThrow('is empty')
		} finally {
			await rm(directory, { recursive: true, force: true })
		}
	})
})
