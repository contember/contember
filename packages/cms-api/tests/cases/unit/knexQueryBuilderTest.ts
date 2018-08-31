import 'mocha'
import { expect } from 'chai'
import * as mockKnex from 'mock-knex'
import * as knex from 'knex'
import KnexWrapper from '../../../src/core/knex/KnexWrapper'
import { SQL } from '../../src/tags'

describe('knex query builder', () => {
	it('constructs "on"', () => {
		const connection = knex({
			// debug: true,
			client: 'pg'
		})

		mockKnex.mock(connection)
		const wrapper = new KnexWrapper(connection)
		const qb = wrapper.queryBuilder()
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
		const sqlResult = qb.toString().replace(/\s+/g, ' ')

		expect(sqlResult).equals(SQL`select "foo"."id"
                                 from "foo"
                                   inner join "bar" as "bar" on ("bar"."a" = 1 or "bar"."a" = 2 or not ("bar"."b" = 1))
                                                                and "bar"."c" in (1, 2, 3) and "bar"."d" is null and not ("bar"."d" is null) and
                                                                "bar"."e" <= "bar"."f"`)
	})

	it('constructs insert with cte', () => {
		const connection = knex({
			// debug: true,
			client: 'pg'
		})

		mockKnex.mock(connection)
		const wrapper = new KnexWrapper(connection)
		const qb = wrapper.queryBuilder()
		qb.with('root_', qb => {
			qb.selectValue('Hello', 'text', 'title')
			qb.selectValue(1, 'int', 'id')
			qb.selectValue(null, 'text', 'content')
		})
		qb.insertFrom('author', ['id', 'title'], qb => {
			qb.table('root_')
			qb.select('id')
			qb.select('title')
		}, 'id')

		const sqlResult = qb.toString().replace(/\s+/g, ' ')
		expect(sqlResult).equals(SQL`
      with "root_" as (select
          'Hello' :: text as title,
          1 :: int as id,
          NULL :: text as content)
      insert into "author" ("id", "title")
        select
          "id",
          "title"
        from "root_"
      returning "id"`)

	})
})
