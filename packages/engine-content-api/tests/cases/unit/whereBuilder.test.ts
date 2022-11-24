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
		tags = def.manyHasMany(Tag)
	}

	export class Tag {
		name = def.stringColumn()
	}
}

const createWhere = (schema: Schema, where: Input.Where) => {
	const pathFactory = new PathFactory()
	const joinBuilder = new JoinBuilder(schema.model)
	const conditionBuilder = new ConditionBuilder()
	const whereOptimizer = new WhereOptimizer(schema.model, new ConditionOptimizer())
	const whereBuilder = new WhereBuilder(schema.model, joinBuilder, conditionBuilder, pathFactory, whereOptimizer, schema.settings.useExistsInHasManyFilter === true)

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
			' where exists (select 1  from "__SCHEMA__"."article" as "root_articles"  where "root_"."id" = "root_articles"."author_id" and "root_articles"."is_public" = ?) and exists (select 1  from "__SCHEMA__"."article" as "root_articles"  where "root_"."id" = "root_articles"."author_id" and "root_articles"."title" = ?)',
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
			' where exists (select 1  from "__SCHEMA__"."article" as "root_articles"  where "root_"."id" = "root_articles"."author_id" and "root_articles"."is_public" = ? and "root_articles"."title" = ?)',
		)
	})


	it('where on has-many relation with isNull', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			articles: {
				id: { isNull: true },
			},
		})
		assert.equal(
			where,
			' where exists (select 1  from (select "root_"."id") as "root_articles_tmp_" left join  "__SCHEMA__"."article" as "root_articles" on  "root_articles_tmp_"."id" = "root_articles"."author_id"  where "root_articles"."id" is null)',
		)
	})

	it('where with nested has-many', () => {
		const schema: Schema = { ...createSchema(WhereBuilderModel), settings: { useExistsInHasManyFilter: true } }
		const where = createWhere(schema, {
			articles: {
				and: [
					{ tags: { name: { eq: 'Hello' } } },
					{ tags: { name: { eq: 'World' } } },
				],
			},
		})
		compareWhere(
			where,
			`where exists (select 1
				from "__SCHEMA__"."article" as "root_articles"
				where "root_"."id" = "root_articles"."author_id"
					and exists (select 1
						from "__SCHEMA__"."article_tags" as "root_articles_tags_junction_"
						inner join  "__SCHEMA__"."tag" as "root_articles_tags" on  "root_articles_tags_junction_"."tag_id" = "root_articles_tags"."id"
						where "root_articles"."id" = "root_articles_tags_junction_"."article_id" and "root_articles_tags"."name" = ?)
					and exists (select 1
						from "__SCHEMA__"."article_tags" as "root_articles_tags_junction_"
						inner join  "__SCHEMA__"."tag" as "root_articles_tags" on  "root_articles_tags_junction_"."tag_id" = "root_articles_tags"."id"
						where "root_articles"."id" = "root_articles_tags_junction_"."article_id" and "root_articles_tags"."name" = ?))`,
		)
	})


	it('where without nested has-many', () => {
		const schema: Schema = { ...createSchema(WhereBuilderModel) }
		const where = createWhere(schema, {
			articles: {
				and: [
					{ tags: { name: { eq: 'Hello' } } },
					{ tags: { name: { eq: 'World' } } },
				],
			},
		})
		compareWhere(
			where,
			`where exists (select 1
				from "__SCHEMA__"."article" as "root_articles"
				left join "__SCHEMA__"."article_tags" as "root_articles_x_root_articles_tags" on "root_articles"."id" = "root_articles_x_root_articles_tags"."article_id"
				left join "__SCHEMA__"."tag" as "root_articles_tags" on "root_articles_x_root_articles_tags"."tag_id" = "root_articles_tags"."id"
				where "root_"."id" = "root_articles"."author_id" and "root_articles_tags"."name" = ? and "root_articles_tags"."name" = ?)`,
		)
	})
})


const compareWhere = (actual: string, expected: string) => {
	const normalize = (s: string) => s.replaceAll(/\s+/g, ' ').trim()
	try {
		assert.equal(normalize(actual), normalize(expected))
	} catch (e) {
		console.log(normalize(actual))
		console.log(normalize(expected))
		throw e
	}
}
