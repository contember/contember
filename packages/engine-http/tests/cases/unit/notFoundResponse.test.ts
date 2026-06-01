import { expect, test } from 'bun:test'
import { KoaContext } from '../../../src/application/types.js'
import { createNotFoundMiddleware } from '../../../src/common/index.js'

const createMockContext = () => {
	const headers: Record<string, string> = {}
	const ctx = {
		status: 200,
		body: undefined as unknown,
		set: (name: string, value: string) => {
			headers[name.toLowerCase()] = value
		},
		get headers() {
			return headers
		},
	}
	return ctx as unknown as KoaContext<any> & { headers: Record<string, string> }
}

const next = () => Promise.resolve()

test('not found middleware responds with consistent JSON error envelope', async () => {
	const ctx = createMockContext()

	await createNotFoundMiddleware()(ctx, next)

	expect(ctx.status).toBe(404)
	expect((ctx as any).headers['content-type']).toBe('application/json')
	expect(JSON.parse(ctx.body as string)).toEqual({ errors: [{ message: 'Route not found', code: 404 }] })
})

test('not found middleware never returns the plain-text "Not Found" body', async () => {
	const ctx = createMockContext()

	await createNotFoundMiddleware()(ctx, next)

	expect(ctx.body).not.toBe('Not Found')
	expect(() => JSON.parse(ctx.body as string)).not.toThrow()
})
