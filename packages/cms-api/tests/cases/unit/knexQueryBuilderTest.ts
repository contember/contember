import 'mocha'
import { expect } from 'chai'
import * as mockKnex from 'mock-knex'
import * as knex from 'knex'
import KnexWrapper from '../../../src/core/knex/KnexWrapper'
import { SQL } from '../../src/tags'
import QueryBuilder from '../../../src/core/knex/QueryBuilder'

interface Test {
	query: (qb: QueryBuilder) => void
	sql: string
	parameters: any[]
}

const execute = async (test: Test) => {
	const connection = knex({
		// debug: true,
		client: 'pg'
	})

	mockKnex.mock(connection)
	const wrapper = new KnexWrapper(connection)
	const qb = wrapper.queryBuilder()

	const tracker = mockKnex.getTracker()
	tracker.install()
	let executed = false
	tracker.on('query', (query, step) => {
		expect(query.sql.replace(/\s+/g, ' ')).equals(test.sql.replace(/\s+/g, ' '))
		expect(query.bindings).deep.equals(test.parameters)
		executed = true
		query.response(null)
	})
	await test.query(qb)
	expect(executed).equals(true)
	tracker.uninstall()
}

describe('knex query builder', () => {
	it('constructs "on"', async () => {
		await execute({
			query: async qb => {
				qb.select(['foo', 'id'])
				qb.table('foo')
				qb.join('bar', 'bar', clause => {
					clause.or(clause => {
						clause.compare(['bar', 'a'], '=', 1)
						clause.compare(['bar', 'a'], '=', 2)
						clause.not(clause => clause.compare(['bar', 'b'], '=', 1))
					})
					clause.and(clause => {
						clause.in(['bar', 'c'], [1, 2, 3])
						clause.null(['bar', 'd'])
						clause.not(clause => clause.null(['bar', 'd']))
						clause.compareColumns(['bar', 'e'], '<=', ['bar', 'f'])
					})
				})
				await qb.getResult()
			},
			sql: SQL`select "foo"."id"
               from "foo"
                 inner join "bar" as "bar"
                   on ("bar"."a" = $1 or "bar"."a" = $2 or not("bar"."b" = $3)) and "bar"."c" in ($4, $5, $6) and "bar"."d" is null and not("bar"."d" is null)
                      and "bar"."e" <= "bar"."f"`,
			parameters: [1, 2, 1, 1, 2, 3]
		})
	})

	it('constructs insert with cte', async () => {
		await execute({
			query: async qb => {
				qb.with('root_', qb => {
					qb.selectValue('Hello', 'text', 'title')
					qb.selectValue(1, 'int', 'id')
					qb.selectValue(null, 'text', 'content')
				})
				await qb.insertFrom(
					'author',
					{
						id: expr => expr.select('id'),
						title: expr => expr.select('title')
					},
					qb => {
						qb.table('root_')
					},
					'id'
				)
			},
			sql: SQL`
				with "root_" as (select $1 :: text as title, $2 :: int as id, $3 :: text as content) 
				insert into "author" ("id", "title") 
					select "id", "title" from "root_" returning "id"`,
			parameters: ['Hello', 1, null]
		})
	})

	it('constructs update with cte', async () => {
		await execute({
			query: async qb => {
				qb.with('root_', qb => {
					qb.selectValue('Hello', 'text', 'title')
					qb.selectValue(1, 'int', 'id')
					qb.selectValue(null, 'text', 'content')
				})
				await qb.updateFrom(
					'author',
					{
						id: expr => expr.select(['root_', 'id']),
						title: expr => expr.select(['root_', 'title'])
					},
					qb => {
						qb.table('root_')
					}
				)
			},
			sql: SQL`with "root_" as (select
                                  $1 :: text as title,
                                  $2 :: int as id,
                                  $3 :: text as content) update "author"
      set "id" = "root_"."id", "title" = "root_"."title" from "root_"`,
			parameters: ['Hello', 1, null]
		})
	})
})
