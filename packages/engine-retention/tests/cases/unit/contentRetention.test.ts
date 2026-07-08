import { describe, expect, test } from 'bun:test'
import { c, createSchema } from '@contember/schema-definition'
import { getEntity } from '@contember/schema-utils'
import { MutationResultType } from '@contember/engine-content-api'
import { interpretContentDeleteResult } from '../../../src/ContentRetentionExecutor.js'

namespace RetentionModel {
	export class Token {
		value = c.stringColumn()
	}
}

const entity = getEntity(createSchema(RetentionModel).model, 'Token')

describe('interpretContentDeleteResult', () => {
	test('counts a successful root delete', () => {
		const result = [{ error: false, result: MutationResultType.ok }]
		expect(interpretContentDeleteResult(result, entity, 'id-1')).toBe(true)
	})

	test('counts a delete that also cascaded / removed orphans (several ok rows) as one root deletion', () => {
		const result = [
			{ error: false, result: MutationResultType.ok },
			{ error: false, result: MutationResultType.ok },
		]
		expect(interpretContentDeleteResult(result, entity, 'id-1')).toBe(true)
	})

	test('does not count a lone nothingToDo (row already removed earlier in the batch via cascade)', () => {
		const result = [{ error: false, result: MutationResultType.nothingToDo }]
		expect(interpretContentDeleteResult(result, entity, 'id-1')).toBe(false)
	})

	test('throws on a hard error (e.g. restrict FK), surfacing entity + message', () => {
		const result = [{ error: true, result: MutationResultType.constraintViolationError, message: 'restrict: children exist' }]
		expect(() => interpretContentDeleteResult(result, entity, 'id-1')).toThrow(/restrict: children exist/)
		expect(() => interpretContentDeleteResult(result, entity, 'id-1')).toThrow(/Token/)
	})

	test('throws when any row in the result errored, even alongside successful ones', () => {
		const result = [
			{ error: false, result: MutationResultType.ok },
			{ error: true, result: MutationResultType.noResultError, message: 'not found or denied' },
		]
		expect(() => interpretContentDeleteResult(result, entity, 'id-1')).toThrow(/not found or denied/)
	})

	test('falls back to the result code when an errored row carries no message', () => {
		const result = [{ error: true, result: MutationResultType.sqlError }]
		expect(() => interpretContentDeleteResult(result, entity, 'id-1')).toThrow(/sqlError/)
	})
})
