import { describe, it } from 'bun:test'
import { ConditionOptimizer } from '../../../src/mapper/select/optimizer/ConditionOptimizer.js'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { WhereOptimizer } from '../../../src/mapper/select/optimizer/WhereOptimizer.js'
import { ConditionBuilder, JoinBuilder, PathFactory, WhereBuilder } from '../../../src/mapper/index.js'
import { Compiler, SelectBuilder } from '@contember/database'
import { Input, Schema } from '@contember/schema'
import { assert } from '../../src/assert.js'

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
		comments = def.oneHasMany(Comment, 'article')
	}

	export class Tag {
		name = def.stringColumn()
	}

	export class Comment {
		content = def.stringColumn()
		article = def.manyHasOne(Article, 'comments')
	}
}

const createWhere = (schema: Schema, where: Input.OptionalWhere, entityName: 'Author' | 'Article' = 'Author') => {
	const pathFactory = new PathFactory()
	const joinBuilder = new JoinBuilder(schema.model)
	const conditionBuilder = new ConditionBuilder()
	const whereOptimizer = new WhereOptimizer(schema.model, new ConditionOptimizer())
	const whereBuilder = new WhereBuilder(
		schema.model,
		joinBuilder,
		conditionBuilder,
		pathFactory,
		whereOptimizer,
		schema.settings.useExistsInHasManyFilter === true,
	)

	const entity = schema.model.entities[entityName]
	const qb = SelectBuilder.create()
		.from(entity.tableName, 'root_')

	return whereBuilder.build(qb, entity, pathFactory.create([]), where).options.where.compile().sql
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
			' where not(exists (select 1  from "__SCHEMA__"."article" as "root_articles"  where "root_"."id" = "root_articles"."author_id"))',
		)
	})

	it('absence on to-one relation with a readable remainder lowers to NOT EXISTS', () => {
		// `{ author: { id: { isNull: true }, name: { eq } } }`: the primary-isNull conjunct is the absence test,
		// the sibling `name` becomes the readable remainder -> NOT EXISTS(present row matching remainder). Null-safe.
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			author: {
				id: { isNull: true },
				name: { eq: 'John' },
			},
		}, 'Article')
		compareWhere(
			where,
			`where not(exists (select 1
				from "__SCHEMA__"."author" as "root_author"
				where "root_"."author_id" = "root_author"."id" and "root_author"."name" = ?))`,
		)
	})

	it('absence on has-many relation with a readable remainder lowers to NOT EXISTS', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			articles: {
				id: { isNull: true },
				title: { eq: 'Hello' },
			},
		})
		compareWhere(
			where,
			`where not(exists (select 1
				from "__SCHEMA__"."article" as "root_articles"
				where "root_"."id" = "root_articles"."author_id" and "root_articles"."title" = ?))`,
		)
	})

	it('absence on many-has-many lowers to NOT EXISTS (bare idiom, no remainder)', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			tags: {
				id: { isNull: true },
			},
		}, 'Article')
		compareWhere(
			where,
			`where not(exists (select 1
				from "__SCHEMA__"."article_tags" as "root_tags_junction_"
				where "root_"."id" = "root_tags_junction_"."article_id"))`,
		)
	})

	it('absence on many-has-many with a readable remainder lowers to NOT EXISTS', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			tags: {
				id: { isNull: true },
				name: { eq: 'red' },
			},
		}, 'Article')
		compareWhere(
			where,
			`where not(exists (select 1
				from "__SCHEMA__"."article_tags" as "root_tags_junction_"
				inner join "__SCHEMA__"."tag" as "root_tags" on "root_tags_junction_"."tag_id" = "root_tags"."id"
				where "root_"."id" = "root_tags_junction_"."article_id" and "root_tags"."name" = ?))`,
		)
	})

	it('equivalent absence spellings (and-wrapper, De Morgan, null alias) all lower to NOT EXISTS', () => {
		const schema = createSchema(WhereBuilderModel)
		const expected = ' where not(exists (select 1  from "__SCHEMA__"."article" as "root_articles"  where "root_"."id" = "root_articles"."author_id"))'
		assert.equal(createWhere(schema, { articles: { and: [{ id: { isNull: true } }] } }), expected)
		assert.equal(createWhere(schema, { articles: { not: { id: { isNull: false } } } }), expected)
		assert.equal(createWhere(schema, { articles: { id: { null: true } } }), expected)
	})

	it('condition-level De Morgan absence lowers to NOT EXISTS', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			author: {
				id: { not: { isNull: false } },
				name: { eq: 'John' },
			},
		}, 'Article')
		compareWhere(
			where,
			`where not(exists (select 1
				from "__SCHEMA__"."author" as "root_author"
				where "root_"."author_id" = "root_author"."id" and "root_author"."name" = ?))`,
		)
	})

	it('compound primary presence remains a valid relation filter', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			author: {
				id: {
					and: [
						{ isNull: false },
						{ eq: '123e4567-e89b-12d3-a456-426614174000' },
					],
				},
			},
		}, 'Article')
		compareWhere(
			where,
			`where exists (select 1
				from "__SCHEMA__"."author" as "root_author"
				where "root_"."author_id" = "root_author"."id" and "root_author"."id" = ?)`,
		)
	})

	it('composes relation absence inside a multi-branch OR', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			author: {
				or: [
					{ id: { isNull: true } },
					{ name: { eq: 'John' } },
				],
			},
		}, 'Article')
		compareWhere(
			where,
			`where (not(exists (select 1
				from "__SCHEMA__"."author" as "root_author"
				where "root_"."author_id" = "root_author"."id"))
				or exists (select 1
				from "__SCHEMA__"."author" as "root_author"
				where "root_"."author_id" = "root_author"."id" and "root_author"."name" = ?))`,
		)
	})

	it('negates a mixed relation absence expression as a set expression', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			author: {
				not: {
					or: [
						{ id: { isNull: true } },
						{ name: { eq: 'John' } },
					],
				},
			},
		}, 'Article')
		compareWhere(
			where,
			`where not((not(exists (select 1
				from "__SCHEMA__"."author" as "root_author"
				where "root_"."author_id" = "root_author"."id"))
				or exists (select 1
				from "__SCHEMA__"."author" as "root_author"
				where "root_"."author_id" = "root_author"."id" and "root_author"."name" = ?)))`,
		)
	})

	it('negates a conjunctive relation absence expression', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			author: {
				not: {
					and: [
						{ id: { isNull: true } },
						{ name: { eq: 'John' } },
					],
				},
			},
		}, 'Article')
		compareWhere(
			where,
			`where exists (select 1
				from "__SCHEMA__"."author" as "root_author"
				where "root_"."author_id" = "root_author"."id" and "root_author"."name" = ?)`,
		)
	})

	it('composes condition-level relation absence inside OR', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			author: {
				id: {
					or: [
						{ isNull: true },
						{ eq: '123e4567-e89b-12d3-a456-426614174000' },
					],
				},
			},
		}, 'Article')
		compareWhere(
			where,
			`where (not(exists (select 1
				from "__SCHEMA__"."author" as "root_author"
				where "root_"."author_id" = "root_author"."id"))
				or exists (select 1
				from "__SCHEMA__"."author" as "root_author"
				where "root_"."author_id" = "root_author"."id" and "root_author"."id" = ?))`,
		)
	})

	it('nested has-many absence is forced to NOT EXISTS even in legacy join mode', () => {
		// COR-3: a has-many absence nested inside another relation must use a correlated NOT EXISTS, never the
		// per-joined-row LEFT JOIN form (which would mis-evaluate `not` for a parent with mixed readable rows).
		const schema = createSchema(WhereBuilderModel) // useExistsInHasManyFilter defaults to false (legacy)
		const where = createWhere(schema, {
			articles: {
				comments: { id: { isNull: true } },
			},
		})
		compareWhere(
			where,
			`where exists (select 1
				from "__SCHEMA__"."article" as "root_articles"
				where "root_"."id" = "root_articles"."author_id"
					and not(exists (select 1
						from "__SCHEMA__"."comment" as "root_articles_comments"
						where "root_articles"."id" = "root_articles_comments"."article_id")))`,
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

	it('handles nulls', () => {
		const schema: Schema = { ...createSchema(WhereBuilderModel) }
		const where = createWhere(schema, {
			name: null,
			articles: {
				and: [
					null,
					{ and: null },
					{ tags: null },
				],
				not: null,
			},
		})
		compareWhere(
			where,
			`where exists (select 1 from "__SCHEMA__"."article" as "root_articles" where "root_"."id" = "root_articles"."author_id")`,
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
