import { describe, expect, test } from 'bun:test'
import { Input, Model } from '@contember/schema'
import { SchemaBuilder } from '@contember/schema-definition'
import { isUnboundedWhere, isValidRetentionInterval } from '../../../src/index.js'

describe('isValidRetentionInterval', () => {
	test.each(['30 days', '1 day', '1 day 12 hours', '90 Days', '2 weeks', '1 year 0 months'])('accepts %p', interval => {
		expect(isValidRetentionInterval(interval)).toBe(true)
	})
	test.each(['', '30', '0 days', '0 days 0 hours', '-10 years', '30 dayz', 'P30D', "30 days'); drop table x; --"])('rejects %p', interval => {
		expect(isValidRetentionInterval(interval)).toBe(false)
	})
})

describe('isUnboundedWhere', () => {
	const model: Model.Schema = new SchemaBuilder()
		.entity('Token', e => e.column('used', c => c.type(Model.ColumnType.Bool)).manyHasOne('owner', r => r.target('Owner')))
		.entity('Owner', e => e.column('name'))
		.buildSchema()
	const entity = model.entities.Token

	const unbounded: Input.Where[] = [
		{},
		{ and: [] },
		{ or: [] },
		{ used: {} },
		{ used: { always: true } },
		{ used: { and: [{}] } },
		{ owner: {} },
		{ or: [{ used: { eq: true } }, {}] },
	]
	test.each(unbounded)('%p is unbounded', where => {
		expect(isUnboundedWhere(model, entity, where)).toBe(true)
	})

	const restrictive: Input.Where[] = [
		{ used: { eq: true } },
		{ and: [{}, { used: { eq: false } }] },
		{ owner: { name: { eq: 'x' } } },
		{ not: { used: { eq: true } } },
		{ used: { never: true } },
	]
	test.each(restrictive)('%p is restrictive', where => {
		expect(isUnboundedWhere(model, entity, where)).toBe(false)
	})
})
