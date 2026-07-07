import { describe, expect, test } from 'bun:test'
import { c, createSchema } from '@contember/schema-definition'
import { getEntity } from '@contember/schema-utils'
import { Compiler } from '@contember/database'
import { createWhereBuilder, PathFactory } from '@contember/engine-content-api'
import { Retention } from '@contember/schema'
import { buildRetentionDelete, buildRetentionSelect } from '../../../src/RawRetentionExecutor.js'

namespace RetentionModel {
	@c.Retention({
		name: 'both',
		olderThan: { field: 'expiresAt', interval: '30 days' },
		where: { used: { eq: true } },
	})
	@c.Retention({ name: 'olderThanOnly', olderThan: { field: 'expiresAt', interval: '7 days' } })
	@c.Retention({ name: 'whereOnly', where: { used: { eq: false } } })
	export class Token {
		value = c.stringColumn()
		used = c.boolColumn()
		expiresAt = c.dateTimeColumn()
	}
}

const schema = createSchema(RetentionModel)
const model = schema.model
const entity = getEntity(model, 'Token')
const whereBuilder = createWhereBuilder(model)

const compileDelete = (policy: Retention.Policy, batchSize: number) => {
	const select = buildRetentionSelect(whereBuilder, new PathFactory(), entity, policy, batchSize)
	return buildRetentionDelete(entity, select).createQuery(new Compiler.Context('stage_test', new Set()))
}

describe('raw retention SQL', () => {
	test('olderThan + where compile to a batched DELETE ... IN (SELECT ... LIMIT)', () => {
		const query = compileDelete(schema.retention.policies['both'], 5000)

		// Batched delete of primary keys picked by a limited sub-select.
		expect(query.sql).toContain('delete from "stage_test"."token"')
		expect(query.sql).toMatch(/"id" in \(select "root_"\."id"\s+from "stage_test"\."token" as "root_"/)
		// olderThan: parameterized interval cast, never string-concatenated.
		expect(query.sql).toContain('"root_"."expires_at" < now() - cast(? as interval)')
		// where: literal condition compiled by the content WhereBuilder.
		expect(query.sql).toContain('"root_"."used" = ?')
		// batch LIMIT applied.
		expect(query.sql).toContain('limit 5000')

		// The interval and the where literal are bound, not inlined.
		expect(query.parameters).toContain('30 days')
		expect(query.parameters).toContain(true)
	})

	test('interval string is always a bound parameter (no injection surface)', () => {
		const injectingPolicy: Retention.Policy = {
			name: 'evil',
			entity: 'Token',
			strategy: 'raw',
			olderThan: { field: 'expiresAt', interval: `30 days'); drop table token; --` },
		}
		const query = compileDelete(injectingPolicy, 1000)
		// The malicious payload appears only as a parameter value, never in the SQL text.
		expect(query.sql).not.toContain('drop table')
		expect(query.parameters).toContain(`30 days'); drop table token; --`)
	})

	test('olderThan-only policy omits a where condition', () => {
		const query = compileDelete(schema.retention.policies['olderThanOnly'], 100)
		expect(query.sql).toContain('cast(? as interval)')
		expect(query.sql).not.toContain('"used"')
		expect(query.parameters).toContain('7 days')
	})

	test('where-only policy omits the interval cutoff', () => {
		const query = compileDelete(schema.retention.policies['whereOnly'], 100)
		expect(query.sql).not.toContain('interval')
		expect(query.sql).toContain('"root_"."used" = ?')
		expect(query.parameters).toContain(false)
	})

	test('a predicate-less policy refuses to build (would delete the whole table)', () => {
		const emptyPolicy: Retention.Policy = { name: 'nuke', entity: 'Token', strategy: 'raw' }
		expect(() => buildRetentionSelect(whereBuilder, new PathFactory(), entity, emptyPolicy, 100)).toThrow(/refusing to delete the entire table/)
	})

	test('olderThan.field must be a DateTime column', () => {
		const badPolicy: Retention.Policy = {
			name: 'bad',
			entity: 'Token',
			strategy: 'raw',
			olderThan: { field: 'value', interval: '1 day' },
		}
		expect(() => buildRetentionSelect(whereBuilder, new PathFactory(), entity, badPolicy, 100)).toThrow(/must be a DateTime column/)
	})
})
