import { describe, it, assert } from 'vitest'
import { ConditionOptimizer } from '../../../src/mapper/select/optimizer/ConditionOptimizer'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { WhereOptimizer } from '../../../src/mapper/select/optimizer/WhereOptimizer'
import { ConditionBuilder, JoinBuilder, PathFactory, WhereBuilder } from '../../../src/mapper'
import { Compiler, SelectBuilder } from '@contember/database'
import { Input, Schema } from '@contember/schema'

namespace WhereBuilderModel {
	export class Author {
		name = def.stringColumn()
		isPublic = def.boolColumn().notNull()
		articles = def.oneHasMany(Article, 'author')
	}

	export class Article {
		title = def.stringColumn()
		isPublic = def.boolColumn().notNull()
		author = def.manyHasOne(Author, 'articles')
	}
}

const createWhere = (schema: Schema, where: Input.Where) => {
	const pathFactory = new PathFactory()
	const joinBuilder = new JoinBuilder(schema.model)
	const conditionBuilder = new ConditionBuilder()
	const whereOptimizer = new WhereOptimizer(schema.model, new ConditionOptimizer())
	const whereBuilder = new WhereBuilder(schema.model, joinBuilder, conditionBuilder, pathFactory, whereOptimizer)

	const qb = SelectBuilder.create()
		.from('author', 'root_')

	return whereBuilder.build(qb, schema.model.entities.Author, pathFactory.create([]), where).options.where.compile().sql
}

describe('where builder', () => {
	it('where on has-many relation with AND outside', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			and: [
				{
					articles: { isPublic: { eq: true } },
				},
				{
					articles: { title: { eq: 'Hello' } },
				},
			],
		})
		assert.equal(
			where,
			' where exists (select 1  from "__SCHEMA__"."article" as "sub_"  where "root_"."id" = "sub_"."author_id" and "sub_"."is_public" = ?) and exists (select 1  from "__SCHEMA__"."article" as "sub_"  where "root_"."id" = "sub_"."author_id" and "sub_"."title" = ?)',
		)
	})

	it('where on has-many relation with AND inside', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			articles: {
				and: [
					{ isPublic: { eq: true } },
					{ title: { eq: 'Hello' } },
				],
			},
		})
		assert.equal(
			where,
			' where exists (select 1  from "__SCHEMA__"."article" as "sub_"  where "root_"."id" = "sub_"."author_id" and "sub_"."is_public" = ? and "sub_"."title" = ?)',
		)
	})
})
