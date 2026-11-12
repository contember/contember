import { describe, expect, test } from 'bun:test'
import { buildException } from '../../../src/event.js'
import { createModuleResolver } from '../../../src/stack.js'

const generic = { type: 'generic', handled: true }

const build = (error: unknown) => buildException(error, new Error('synthetic'), generic, createModuleResolver('/app'), 3, 1000)

const summary = (error: unknown) => build(error).values.map(({ type, value, mechanism }) => ({ type, value, mechanism }))

describe('buildException', () => {
	test('reports an error with its stack', () => {
		const { values, serialized } = build(new TypeError('bad'))
		expect(values).toHaveLength(1)
		expect(values[0]).toMatchObject({ type: 'TypeError', value: 'bad', mechanism: generic })
		expect(values[0].stacktrace?.frames.at(-1)?.function).toBeDefined()
		expect(serialized).toBeUndefined()
	})

	test('reports the cause chain, root cause first', () => {
		class DbError extends Error {
			override name = 'DbError'
		}
		const error = new DbError('outer', { cause: new TypeError('middle', { cause: new Error('root') }) })
		expect(summary(error)).toEqual([
			{ type: 'Error', value: 'root', mechanism: { type: 'chained', handled: true, source: 'cause', exception_id: 2, parent_id: 1 } },
			{ type: 'TypeError', value: 'middle', mechanism: { type: 'chained', handled: true, source: 'cause', exception_id: 1, parent_id: 0 } },
			{ type: 'DbError', value: 'outer', mechanism: { ...generic, exception_id: 0 } },
		])
	})

	test('reports at most 5 linked errors', () => {
		let error = new Error('c0')
		for (let i = 1; i < 9; i++) {
			error = new Error(`c${i}`, { cause: error })
		}
		expect(summary(error).map(it => it.value)).toEqual(['c3', 'c4', 'c5', 'c6', 'c7', 'c8'])
	})

	test('reports AggregateError members as an exception group', () => {
		const error = new AggregateError([new Error('a1'), new RangeError('a2')], 'many', { cause: new Error('agg cause') })
		expect(summary(error)).toEqual([
			{ type: 'RangeError', value: 'a2', mechanism: { type: 'chained', handled: true, source: 'errors[1]', exception_id: 3, parent_id: 0 } },
			{ type: 'Error', value: 'a1', mechanism: { type: 'chained', handled: true, source: 'errors[0]', exception_id: 2, parent_id: 0 } },
			{ type: 'Error', value: 'agg cause', mechanism: { type: 'chained', handled: true, source: 'cause', exception_id: 1, parent_id: 0 } },
			{ type: 'AggregateError', value: 'many', mechanism: { ...generic, is_exception_group: true, exception_id: 0 } },
		])
	})

	test('reports at most 5 members of a large AggregateError', () => {
		const error = new AggregateError(Array.from({ length: 200 }, (_, i) => new Error(`m${i}`)), 'many')
		expect(summary(error).map(it => it.value)).toEqual(['m4', 'm3', 'm2', 'm1', 'm0', 'many'])
	})

	test('serializes a plain object one level shallower at a time until it fits 100 kB', () => {
		expect(build({ a: { b: 'x'.repeat(200_000) }, c: 1 }).serialized).toEqual({ a: '[Object]', c: 1 })
	})

	test('ignores a cause that is not an Error', () => {
		expect(summary(new Error('outer', { cause: 'just text' }))).toEqual([{ type: 'Error', value: 'outer', mechanism: generic }])
	})

	test('truncates messages to 250 characters', () => {
		expect(build(new Error('x'.repeat(300))).values[0].value).toBe(`${'x'.repeat(250)}...`)
	})

	test('reports a plain object by its name and message, with the object serialized', () => {
		const { values, serialized } = build({ code: 'E1', message: 'plain message', name: 'Custom' })
		expect(values).toHaveLength(1)
		expect(values[0]).toMatchObject({
			type: 'Error',
			value: `'Custom' captured as exception with message 'plain message'`,
			mechanism: { ...generic, synthetic: true },
		})
		expect(serialized).toEqual({ code: 'E1', message: 'plain message', name: 'Custom' })
	})

	test('reports a plain object without name and message by its sorted keys', () => {
		expect(build({ beta: 1, alpha: 2 }).values[0].value).toBe('Object captured as exception with keys: alpha, beta')
		expect(build({ message: 'only message' }).values[0].value).toBe('only message')
		expect(build({}).values[0].value).toBe('Object captured as exception with keys: [object has no keys]')
	})

	test('reports another value as its string form, with the stack of the synthetic error', () => {
		const { values, serialized } = build(42)
		expect(values[0]).toMatchObject({ type: 'Error', value: '42', mechanism: { ...generic, synthetic: true } })
		expect(values[0].stacktrace?.frames.length).toBeGreaterThan(0)
		expect(serialized).toBeUndefined()
	})
})
