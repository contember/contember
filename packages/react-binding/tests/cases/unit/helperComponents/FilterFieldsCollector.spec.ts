import { describe, expect, it } from 'vitest'
import { FilterFieldsCollector } from '../../../../src/helperComponents/helpers/FilterFieldsCollector'
import { schema } from './schema'

describe('Filter fields collector', () => {
	it('collects simple column', () => {
		const collector = new FilterFieldsCollector(schema, {
			title: {
				eq: 'foo',
			},
		})
		expect(collector.collectFields(schema.getEntity('Article'))).toEqual(new Set(['title']))
	})

	it('collects multiple columns with AND', () => {
		const collector = new FilterFieldsCollector(schema, {
			and: [
				{
					title: {
						eq: 'foo',
					},
				},
				{
					isPublished: {
						eq: true,
					},
				},
			],
		})
		expect(collector.collectFields(schema.getEntity('Article'))).toEqual(new Set(['title', 'isPublished']))
	})

	it('collects simple column with NOT', () => {
		const collector = new FilterFieldsCollector(schema, {
			not: {
				title: {
					eq: 'foo',
				},
			},
		})
		expect(collector.collectFields(schema.getEntity('Article'))).toEqual(new Set(['title']))
	})

	it('collects column over relation', () => {
		const collector = new FilterFieldsCollector(schema, {
			category: {
				title: {
					eq: 'foo',
				},
			},
		})
		expect(collector.collectFields(schema.getEntity('Article'))).toEqual(new Set(['category.title']))
	})
})
