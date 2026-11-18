import { describe, expect, test } from 'bun:test'
import { ContentGraphQLEngine } from '../../../src/content/ContentGraphQLEngine.js'
import { HttpResponse } from '../../../src/common/index.js'
import { createContentControllerHarness } from '../../contentControllerHarness.js'

describe.each<ContentGraphQLEngine>(['graphql-js', 'graphql-json'])('on %s', engine => {
	test('force-primary routes preparation, cache validation and content to primary even with an unavailable replica', async () => {
		const harness = createContentControllerHarness(engine)
		try {
			harness.setReplicaUnavailable()
			const { koa, result } = await harness.request('{ marker }', { 'x-contember-force-primary': '1', 'x-contember-ref': 'old-ref' })
			expect(result).toBeUndefined()
			expect(koa.body).toBe('{"data":{"marker":"primary"}}')
			expect(koa.response.get('X-Contember-Mutation')).toBe('')
			expect(harness.statements.every(it => it.side === 'primary')).toBe(true)
			expect(harness.statements.some(it => it.sql.includes('"stage_transaction"'))).toBe(true)
			expect(harness.preparation).toEqual([harness.primarySystem, harness.primarySystem])
		} finally {
			await harness.close()
		}
	})

	test('a forced primary read can return 304 from the primary reference', async () => {
		const harness = createContentControllerHarness(engine)
		try {
			const { result } = await harness.request('{ marker }', { 'x-contember-force-primary': '1', 'x-contember-ref': 'new-ref' })
			expect(result).toBeInstanceOf(HttpResponse)
			expect(result instanceof HttpResponse && result.code).toBe(304)
			expect(harness.statements.some(it => it.sql === 'SELECT marker')).toBe(false)
		} finally {
			await harness.close()
		}
	})

	test('without the header, preparation, cache validation and content read the replica', async () => {
		const harness = createContentControllerHarness(engine)
		try {
			const { koa } = await harness.request('{ marker }', { 'x-contember-ref': 'new-ref' })
			expect(koa.body).toBe('{"data":{"marker":"replica"}}')
			expect(harness.statements.every(it => it.side === 'replica')).toBe(true)
			expect(harness.statements.some(it => it.sql.includes('"stage_transaction"'))).toBe(true)
			expect(harness.preparation).toEqual([harness.replicaSystem, harness.replicaSystem])
		} finally {
			await harness.close()
		}
	})

	test('the header accepts the same truthy values as X-Contember-Force-Ok; ordinary queries still read the replica', async () => {
		const harness = createContentControllerHarness(engine)
		try {
			for (const value of ['1', 'true', ' ON ', 'yes']) {
				const { koa } = await harness.request('{ marker }', { 'x-contember-force-primary': value })
				expect(koa.body).toBe('{"data":{"marker":"primary"}}')
			}
			const headerCases: Record<string, string>[] = [{}, { 'x-contember-force-primary': '0' }, { 'x-contember-force-primary': 'false' }]
			for (const headers of headerCases) {
				const { koa } = await harness.request('{ marker }', headers)
				expect(koa.body).toBe('{"data":{"marker":"replica"}}')
			}
		} finally {
			await harness.close()
		}
	})

	test('without the config opt-in the header is ignored and mutations are not marked', async () => {
		const harness = createContentControllerHarness(engine, { forcePrimaryHeader: false })
		try {
			const query = await harness.request('{ marker }', { 'x-contember-force-primary': '1' })
			expect(query.koa.body).toBe('{"data":{"marker":"replica"}}')
			expect(harness.statements.every(it => it.side === 'replica')).toBe(true)
			expect(harness.preparation).toEqual([harness.replicaSystem, harness.replicaSystem])
			const mutation = await harness.request('mutation { marker }')
			expect(mutation.koa.body).toBe('{"data":{"marker":"primary"}}')
			expect(mutation.koa.response.get('X-Contember-Mutation')).toBe('')
		} finally {
			await harness.close()
		}
	})

	test('mutations run on primary and are marked even when a later root fails', async () => {
		const harness = createContentControllerHarness(engine)
		try {
			const { koa } = await harness.request('mutation { marker fail }')
			expect(koa.response.get('X-Contember-Mutation')).toBe('1')
			expect(koa.body).toContain('"marker":"primary"')
			expect(koa.body).toContain('Mutation failed')
			const invalid = await harness.request('mutation { unknown }')
			expect(invalid.koa.response.get('X-Contember-Mutation')).toBe('')
		} finally {
			await harness.close()
		}
	})

	test('a project without a read replica does not mark mutations', async () => {
		const harness = createContentControllerHarness(engine, { withReplica: false })
		try {
			const { koa } = await harness.request('mutation { marker }')
			expect(koa.body).toBe('{"data":{"marker":"primary"}}')
			expect(koa.response.get('X-Contember-Mutation')).toBe('')
		} finally {
			await harness.close()
		}
	})
})
