import { describe, it } from 'bun:test'
import { ConditionOptimizer } from '../../../src/mapper/select/optimizer/ConditionOptimizer.js'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { WhereOptimizer } from '../../../src/mapper/select/optimizer/WhereOptimizer.js'
import { ConditionBuilder, JoinBuilder, PathFactory, WhereBuilder } from '../../../src/mapper/index.js'
import { Compiler, SelectBuilder } from '@contember/database'
import { Acl, Input, Schema } from '@contember/schema'
import { assert } from '../../src/assert.js'
import type { PredicateInjection } from '../../../src/acl/PredicateInjection.js'
import { PredicateFactory, PredicatesInjector, VariableInjector } from '../../../src/index.js'

namespace WhereBuilderModel {
	export class Author {
		name = def.stringColumn()
		isPublic = def.boolColumn().notNull()
		secret = def.stringColumn()
		secretVisible = def.boolColumn().notNull()
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
		isPublic = def.boolColumn().notNull()
		article = def.manyHasOne(Article, 'comments')
	}

	export class GuardRoot {
		parent = def.manyHasOne(GuardParent)
	}

	export class GuardParent {
		child = def.manyHasOne(GuardChild)
	}

	export class GuardChild {
		owner = def.manyHasOne(GuardOwner)
	}

	export class GuardOwner {
		active = def.boolColumn().notNull()
		flag = def.boolColumn().notNull()
		secret = def.stringColumn()
	}
}

type WhereBuilderEntityName = 'Author' | 'Article' | 'Comment' | 'GuardRoot' | 'GuardParent'

const createWhere = (
	schema: Schema,
	where: Input.OptionalWhere,
	entityName: WhereBuilderEntityName = 'Author',
	predicateInjection?: Input.OptionalWhere | PredicateInjection,
	disableOptimizer = false,
	useAdvancedBuilder = false,
) => {
	const pathFactory = new PathFactory()
	const joinBuilder = new JoinBuilder(schema.model)
	const conditionBuilder = new ConditionBuilder()
	const whereOptimizer = new WhereOptimizer(schema.model, new ConditionOptimizer(), disableOptimizer ? { disable: true } : undefined)
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
	const path = pathFactory.create([])
	const input = predicateInjection ?? where
	const result = useAdvancedBuilder
		? whereBuilder.buildAdvanced(entity, path, input, callback => qb.where(clause => callback(clause)))
		: whereBuilder.build(qb, entity, path, input)

	return result.options.where.compile().sql
}

const readableRelationInjection = (where: Input.OptionalWhere): PredicateInjection => ({
	where,
	relationGuard: {
		create: relationContext =>
			relationContext.targetEntity.name === 'Tag'
				? { name: { eq: 'visible' } }
				: { isPublic: { eq: true } },
	},
})

const leafOnlyRelationInjection = (where: Input.OptionalWhere): PredicateInjection => ({
	where,
	relationGuard: {
		create: relationContext =>
			relationContext.targetEntity.name === 'Author'
				? { isPublic: { eq: true } }
				: relationContext.targetEntity.name === 'Comment'
				? { isPublic: { eq: true } }
				: relationContext.targetEntity.name === 'Tag'
				? { name: { eq: 'visible' } }
				: {},
	},
})

const isOptionalWhere = (value: unknown): value is Input.OptionalWhere => value !== null && typeof value === 'object' && !Array.isArray(value)

const createAclInjector = (schema: Schema): PredicatesInjector => {
	const permissions: Acl.Permissions = {
		Author: {
			predicates: {
				visible: { isPublic: { eq: true } },
				isPublicReadable: { secret: { eq: 'ok' } },
				secretReadable: { secretVisible: { eq: true } },
			},
			operations: {
				read: {
					id: 'visible',
					name: 'visible',
					isPublic: 'isPublicReadable',
					secret: 'secretReadable',
					secretVisible: 'visible',
					articles: 'visible',
				},
			},
		},
		Article: {
			predicates: {},
			operations: { read: { id: true, title: true, isPublic: true, author: true, tags: true, comments: true } },
		},
		Comment: {
			predicates: { visible: { isPublic: { eq: true } } },
			operations: { read: { id: 'visible', content: 'visible', isPublic: 'visible', article: 'visible' } },
		},
		Tag: {
			predicates: { visible: { name: { eq: 'visible' } } },
			operations: { read: { id: 'visible', name: 'visible' } },
		},
		GuardRoot: {
			predicates: {},
			operations: { read: { id: true, parent: true } },
		},
		GuardParent: {
			predicates: {},
			operations: { read: { id: true, child: true } },
		},
		GuardChild: {
			predicates: { visible: { owner: { flag: { eq: true } } } },
			operations: { read: { id: 'visible', owner: 'visible' } },
		},
		GuardOwner: {
			predicates: {
				visible: { active: { eq: true } },
				flagReadable: { secret: { eq: 'ok' } },
			},
			operations: { read: { id: 'visible', active: 'visible', flag: 'flagReadable', secret: 'visible' } },
		},
	}
	const predicateFactory = new PredicateFactory(permissions, schema.model, new VariableInjector(schema.model, {}))
	return new PredicatesInjector(schema.model, predicateFactory)
}

const createLegacyInjection = (
	schema: Schema,
	entityName: WhereBuilderEntityName,
	where: Input.OptionalWhere,
): Input.OptionalWhere => createAclInjector(schema).inject(schema.model.entities[entityName], where)

const createExplicitInjection = (
	schema: Schema,
	entityName: WhereBuilderEntityName,
	where: Input.OptionalWhere,
): PredicateInjection => {
	return createAclInjector(schema).injectForRead(schema.model.entities[entityName], where)
}

describe('where builder', () => {
	it('omits only the canonical true guard sentinel in both builder entry points', () => {
		const schema = createSchema(WhereBuilderModel)
		const testCases: { where: Input.OptionalWhere; injection: PredicateInjection; expected: string }[] = [
			{
				where: { title: { eq: 'visible' } },
				injection: {
					where: { title: { eq: 'visible' } },
					guard: { id: { always: true } },
					relationGuard: { create: () => ({}) },
				},
				expected: ' where "root_"."title" = ?',
			},
			{
				where: { author: { id: { isNull: false } } },
				injection: {
					where: { author: { id: { isNull: false } } },
					guard: {},
					relationGuard: { create: relationContext => ({ [relationContext.targetEntity.primary]: { always: true } }) },
				},
				expected: ' where not("root_"."author_id" is null)',
			},
		]
		for (const testCase of testCases) {
			for (const useAdvancedBuilder of [false, true]) {
				assert.equal(
					createWhere(schema, testCase.where, 'Article', testCase.injection, false, useAdvancedBuilder),
					testCase.expected,
				)
			}
		}
	})

	it('normalizes nullable user boolean entries without merging the ACL guard', () => {
		const schema = createSchema(WhereBuilderModel)
		const where: Input.OptionalWhere = {
			not: {
				or: [
					null,
					{
						and: [
							null,
							{ author: { or: [null, { name: { eq: 'probe' } }] } },
						],
					},
				],
			},
		}
		const injection: PredicateInjection = {
			where,
			guard: { isPublic: { eq: true } },
			relationGuard: { create: () => ({}) },
		}
		for (const useAdvancedBuilder of [false, true]) {
			assert.equal(
				createWhere(schema, where, 'Article', injection, false, useAdvancedBuilder),
				' where not("root_author"."name" = ?) and "root_"."is_public" = ?',
			)
		}
	})

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

	it('keeps a public primary-null condition with a sibling as an ordinary to-one condition', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			author: {
				id: { isNull: true },
				name: { eq: 'John' },
			},
		}, 'Article')
		assert.equal(where, ' where "root_author"."id" is null and "root_author"."name" = ?')
	})

	it('keeps an explicit public AND wrapper around primary-null and sibling conditions', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			author: {
				and: [
					{ id: { isNull: true } },
					{ name: { eq: 'John' } },
				],
			},
		}, 'Article')
		assert.equal(where, ' where "root_author"."id" is null and "root_author"."name" = ?')
	})

	it('keeps a public primary-null condition with a sibling as an ordinary has-many condition', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			articles: {
				id: { isNull: true },
				title: { eq: 'Hello' },
			},
		})
		compareWhere(
			where,
			`where exists (select 1
				from (select "root_"."id") as "root_articles_tmp_"
				left join "__SCHEMA__"."article" as "root_articles" on "root_articles_tmp_"."id" = "root_articles"."author_id"
				where "root_articles"."id" is null and "root_articles"."title" = ?)`,
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

	it('applies the relation target guard inside pure isNull set semantics for every relation kind', () => {
		const schema = createSchema(WhereBuilderModel)
		const toOne = createWhere(
			schema,
			{ author: { id: { isNull: true } } },
			'Article',
			readableRelationInjection({ author: { id: { isNull: true } } }),
		)
		const toMany = createWhere(
			schema,
			{ articles: { id: { isNull: true } } },
			'Author',
			readableRelationInjection({ articles: { id: { isNull: true } } }),
		)
		const manyToMany = createWhere(
			schema,
			{ tags: { id: { isNull: true } } },
			'Article',
			readableRelationInjection({ tags: { id: { isNull: true } } }),
		)
		compareWhere(
			toOne,
			`where not(exists (select 1
				from "__SCHEMA__"."author" as "root_author"
				where "root_"."author_id" = "root_author"."id" and "root_author"."is_public" = ?))`,
		)
		compareWhere(
			toMany,
			`where not(exists (select 1
				from "__SCHEMA__"."article" as "root_articles"
				where "root_"."id" = "root_articles"."author_id" and "root_articles"."is_public" = ?))`,
		)
		compareWhere(
			manyToMany,
			`where not(exists (select 1
				from "__SCHEMA__"."article_tags" as "root_tags_junction_"
				inner join "__SCHEMA__"."tag" as "root_tags" on "root_tags_junction_"."tag_id" = "root_tags"."id"
				where "root_"."id" = "root_tags_junction_"."article_id" and "root_tags"."name" = ?))`,
		)
	})

	it('keeps a relation target guard outside user NOT for to-one, to-many, and many-to-many filters', () => {
		const schema = createSchema(WhereBuilderModel)
		const probe = '123e4567-e89b-12d3-a456-426614174000'
		const toOneWhere = { author: { not: { id: { eq: probe } } } }
		const toManyWhere = { articles: { not: { id: { eq: probe } } } }
		const manyToManyWhere = { tags: { not: { id: { eq: probe } } } }
		const toOne = createWhere(schema, toOneWhere, 'Article', readableRelationInjection(toOneWhere))
		const toMany = createWhere(schema, toManyWhere, 'Author', readableRelationInjection(toManyWhere))
		const manyToMany = createWhere(schema, manyToManyWhere, 'Article', readableRelationInjection(manyToManyWhere))
		assert.equal(toOne, ' where not("root_author"."id" = ?) and "root_author"."is_public" = ?')
		compareWhere(
			toMany,
			`where exists (select 1
				from "__SCHEMA__"."article" as "root_articles"
				where "root_"."id" = "root_articles"."author_id" and not("root_articles"."id" = ?) and "root_articles"."is_public" = ?)`,
		)
		compareWhere(
			manyToMany,
			`where exists (select 1
				from "__SCHEMA__"."article_tags" as "root_tags_junction_"
				inner join "__SCHEMA__"."tag" as "root_tags" on "root_tags_junction_"."tag_id" = "root_tags"."id"
				where "root_"."id" = "root_tags_junction_"."article_id" and not("root_tags"."id" = ?) and "root_tags"."name" = ?)`,
		)
	})

	it('preserves guarded relation semantics with the where optimizer enabled and disabled', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = {
			articles: {
				or: [
					{ id: { isNull: true } },
					{ not: { id: { eq: '123e4567-e89b-12d3-a456-426614174000' } } },
				],
			},
		}
		const injection = readableRelationInjection(where)
		const optimized = createWhere(schema, where, 'Author', injection)
		const unoptimized = createWhere(schema, where, 'Author', injection, true)
		assert.equal(optimized, unoptimized)
		compareWhere(
			optimized,
			`where (not(exists (select 1
				from "__SCHEMA__"."article" as "root_articles"
				where "root_"."id" = "root_articles"."author_id" and "root_articles"."is_public" = ?))
				or exists (select 1
				from "__SCHEMA__"."article" as "root_articles"
				where "root_"."id" = "root_articles"."author_id" and not("root_articles"."id" = ?) and "root_articles"."is_public" = ?))`,
		)
	})

	it('keeps a to-one target guard positive under an enclosing NOT', () => {
		const schema = createSchema(WhereBuilderModel)
		const where: Input.OptionalWhere = { not: { author: { id: { isNull: false } } } }
		const injection = readableRelationInjection(where)
		const optimized = createWhere(schema, where, 'Article', injection)
		const unoptimized = createWhere(schema, where, 'Article', injection, true)
		assert.equal(optimized, unoptimized)
		compareWhere(
			optimized,
			`where not(not("root_author"."id" is null) and "root_author"."is_public" = ?)
				and "root_author"."is_public" = ?`,
		)
	})

	it('keeps an enclosing-NOT target guard local to its OR branch', () => {
		const schema = createSchema(WhereBuilderModel)
		const where: Input.OptionalWhere = {
			or: [
				{ not: { author: { id: { isNull: false } } } },
				{ title: { eq: 'fallback' } },
			],
		}
		const sql = createWhere(schema, where, 'Article', readableRelationInjection(where))
		compareWhere(
			sql,
			`where (not(not("root_author"."id" is null) and "root_author"."is_public" = ?)
				and "root_author"."is_public" = ?
				or "root_"."title" = ?)`,
		)
	})

	it('keeps nested 1:N and M:N target guards positive under enclosing NOT in both filter modes', () => {
		const schemas: Schema[] = [
			createSchema(WhereBuilderModel),
			{ ...createSchema(WhereBuilderModel), settings: { useExistsInHasManyFilter: true } },
		]
		for (const schema of schemas) {
			for (
				const nestedWhere of [
					{ articles: { comments: { id: { isNull: false } } } },
					{ articles: { tags: { id: { isNull: false } } } },
				]
			) {
				const where: Input.OptionalWhere = { not: nestedWhere }
				const sql = createWhere(schema, where, 'Author', readableRelationInjection(where))
				const normalized = sql.replaceAll(/\s+/g, ' ').trim()
				assert.equal(normalized.includes(') and exists (select 1 from "__SCHEMA__"."article" as "root_articles"'), true)
				assert.equal(normalized.match(/"root_articles"\."is_public" = \?/g)?.length, 2)
				if ('comments' in nestedWhere.articles) {
					assert.equal(normalized.match(/"root_articles_comments"\."is_public" = \?/g)?.length, 2)
				} else {
					assert.equal(normalized.match(/"root_articles_tags"\."name" = \?/g)?.length, 2)
				}
			}
		}
	})

	it('carries a nested to-one guard through an unrestricted intermediate under NOT and keeps it OR-local', () => {
		const schema = createSchema(WhereBuilderModel)
		const where: Input.OptionalWhere = {
			or: [
				{
					not: {
						and: [
							{ article: { author: { id: { isNull: false } } } },
							{ content: { notEq: 'blocked' } },
						],
					},
				},
				{ content: { eq: 'fallback' } },
			],
		}
		const injection = leafOnlyRelationInjection(where)
		const optimized = createWhere(schema, where, 'Comment', injection)
		const unoptimized = createWhere(schema, where, 'Comment', injection, true)
		assert.equal(optimized, unoptimized)

		const normalized = optimized.replaceAll(/\s+/g, ' ').trim()
		assert.equal(normalized.match(/"root_article_author"\."is_public" = \?/g)?.length, 2)
		assert.equal(normalized.includes(') and "root_article_author"."is_public" = ?'), true)
		assert.equal(normalized.endsWith('or "root_"."content" = ?)'), true)
	})

	it('carries legacy nested 1:N and M:N guards through an unrestricted intermediate under NOT', () => {
		const schema = createSchema(WhereBuilderModel)
		for (
			const nestedWhere of [
				{ articles: { comments: { id: { isNull: false } } } },
				{ articles: { tags: { id: { isNull: false } } } },
			]
		) {
			const where: Input.OptionalWhere = { not: nestedWhere }
			const injection = leafOnlyRelationInjection(where)
			const optimized = createWhere(schema, where, 'Author', injection)
			const unoptimized = createWhere(schema, where, 'Author', injection, true)
			assert.equal(optimized, unoptimized)

			const normalized = optimized.replaceAll(/\s+/g, ' ').trim()
			assert.equal(normalized.includes(') and exists (select 1 from "__SCHEMA__"."article" as "root_articles"'), true)
			assert.equal(normalized.includes('"root_articles"."is_public" = ?'), false)
			if ('comments' in nestedWhere.articles) {
				assert.equal(normalized.match(/"root_articles_comments"\."is_public" = \?/g)?.length, 2)
			} else {
				assert.equal(normalized.match(/"root_articles_tags"\."name" = \?/g)?.length, 2)
			}
		}
	})

	it('keeps exported legacy inject results safe under enclosing NOT', () => {
		const schema = createSchema(WhereBuilderModel)
		const testCases: { entity: 'Article' | 'Comment'; where: Input.OptionalWhere; guardPattern: RegExp }[] = [
			{
				entity: 'Article',
				where: { not: { author: { id: { isNull: false } } } },
				guardPattern: /"root_author"\."is_public" = \?/g,
			},
			{
				entity: 'Comment',
				where: { not: { article: { author: { id: { isNull: false } } } } },
				guardPattern: /"root_article_author"\."is_public" = \?/g,
			},
		]
		for (const testCase of testCases) {
			const where: Input.OptionalWhere = testCase.where
			const injected = createLegacyInjection(schema, testCase.entity, where)
			const jsonRoundTrip: unknown = JSON.parse(JSON.stringify(injected))
			if (!isOptionalWhere(jsonRoundTrip)) {
				throw new Error('Expected a where object after JSON round-trip')
			}
			const variants: Input.OptionalWhere[] = [
				injected,
				{ ...injected },
				structuredClone(injected),
				jsonRoundTrip,
			]
			const expected = createWhere(schema, where, testCase.entity, injected)
			for (const variant of variants) {
				const optimized = createWhere(schema, where, testCase.entity, variant)
				const unoptimized = createWhere(schema, where, testCase.entity, variant, true)
				assert.equal(optimized, expected)
				assert.equal(unoptimized, expected)

				const normalized = optimized.replaceAll(/\s+/g, ' ').trim()
				const guardMatches = normalized.match(testCase.guardPattern) ?? []
				assert.equal(guardMatches.length >= 2, true)
				const guardMatch = guardMatches[0]
				if (guardMatch === undefined) {
					throw new Error('Expected a relation guard match')
				}
				assert.equal(normalized.lastIndexOf(guardMatch) > normalized.indexOf(') and '), true)
			}
		}
	})

	it('derives legacy NOT obligations only from user-probed fields', () => {
		const schema = createSchema(WhereBuilderModel)
		const testCases: { entity: 'Article' | 'Comment'; where: Input.OptionalWhere; expected: Input.OptionalWhere }[] = [
			{
				entity: 'Article',
				where: { not: { author: { id: { isNull: false } } } },
				expected: {
					and: [
						{ not: { author: { and: [{ id: { isNull: false } }, { isPublic: { eq: true } }] } } },
						{ author: { isPublic: { eq: true } } },
					],
				},
			},
			{
				entity: 'Comment',
				where: { not: { article: { author: { id: { isNull: false } } } } },
				expected: {
					and: [
						{
							and: [
								{ not: { article: { author: { and: [{ id: { isNull: false } }, { isPublic: { eq: true } }] } } } },
								{ article: { author: { isPublic: { eq: true } } } },
							],
						},
						{ isPublic: { eq: true } },
					],
				},
			},
		]
		for (const testCase of testCases) {
			const explicit = createExplicitInjection(schema, testCase.entity, testCase.where)
			const explicitOptimized = createWhere(schema, testCase.where, testCase.entity, explicit)
			const explicitUnoptimized = createWhere(schema, testCase.where, testCase.entity, explicit, true)
			assert.equal(explicitUnoptimized, explicitOptimized)

			const legacy = createLegacyInjection(schema, testCase.entity, testCase.where)
			assert.deepStrictEqual(legacy, testCase.expected)
			assert.equal(JSON.stringify(legacy).includes('"secret"'), false)
			const expectedOptimized = createWhere(schema, testCase.where, testCase.entity, legacy)
			const expectedUnoptimized = createWhere(schema, testCase.where, testCase.entity, legacy, true)
			const jsonRoundTrip: unknown = JSON.parse(JSON.stringify(legacy))
			if (!isOptionalWhere(jsonRoundTrip)) {
				throw new Error('Expected a where object after JSON round-trip')
			}
			for (const variant of [legacy, { ...legacy }, structuredClone(legacy), jsonRoundTrip]) {
				const optimized = createWhere(schema, testCase.where, testCase.entity, variant)
				const unoptimized = createWhere(schema, testCase.where, testCase.entity, variant, true)
				assert.equal(optimized, expectedOptimized)
				assert.equal(unoptimized, expectedUnoptimized)
				for (const sql of [explicitOptimized, explicitUnoptimized, optimized, unoptimized]) {
					assert.equal(sql.includes('"secret"'), false)
					assert.equal(sql.match(/"root_(?:article_)?author"\."is_public" = \?/g)?.length, 2)
				}
			}
		}
	})

	it('keeps a scalar cell guard positive under legacy NOT without guarding ACL-internal fields', () => {
		const schema = createSchema(WhereBuilderModel)
		const where: Input.OptionalWhere = { not: { secret: { eq: 'probe' } } }
		const legacy = createLegacyInjection(schema, 'Author', where)
		assert.deepStrictEqual(legacy, {
			and: [
				{
					and: [
						{ not: { and: [{ secret: { eq: 'probe' } }, { secretVisible: { eq: true } }] } },
						{ secretVisible: { eq: true } },
					],
				},
				{ isPublic: { eq: true } },
			],
		})
		const jsonRoundTrip: unknown = JSON.parse(JSON.stringify(legacy))
		if (!isOptionalWhere(jsonRoundTrip)) {
			throw new Error('Expected a where object after JSON round-trip')
		}
		const explicit = createExplicitInjection(schema, 'Author', where)
		for (const variant of [legacy, { ...legacy }, structuredClone(legacy), jsonRoundTrip]) {
			for (const disableOptimizer of [false, true]) {
				const legacySql = createWhere(schema, where, 'Author', variant, disableOptimizer)
				const explicitSql = createWhere(schema, where, 'Author', explicit, disableOptimizer)
				assert.equal(legacySql.match(/"root_"\."secret" = \?/g)?.length, 1)
				assert.equal(legacySql.match(/"root_"\."secret_visible" = \?/g)?.length, disableOptimizer ? 2 : 1)
				assert.equal(explicitSql.match(/"root_"\."secret" = \?/g)?.length, 1)
				assert.equal(explicitSql.match(/"root_"\."secret_visible" = \?/g)?.length, 1)
			}
		}
	})

	it('row-expands generated relation guards without treating their fields as user probes', () => {
		const schema = createSchema(WhereBuilderModel)
		const ownerGuard: Input.OptionalWhere = {
			owner: {
				and: [
					{ flag: { eq: true } },
					{ active: { eq: true } },
				],
			},
		}
		const testCases: {
			entity: 'GuardParent' | 'GuardRoot'
			where: Input.OptionalWhere
			expected: Input.OptionalWhere
			guardPattern: RegExp
		}[] = [
			{
				entity: 'GuardParent',
				where: { not: { child: { id: { isNull: false } } } },
				expected: {
					and: [
						{ not: { child: { and: [{ id: { isNull: false } }, ownerGuard] } } },
						{ child: ownerGuard },
					],
				},
				guardPattern: /"root_child_owner"\."(active|flag)" = \?/g,
			},
			{
				entity: 'GuardRoot',
				where: { not: { parent: { child: { id: { isNull: false } } } } },
				expected: {
					and: [
						{ not: { parent: { child: { and: [{ id: { isNull: false } }, ownerGuard] } } } },
						{ parent: { child: ownerGuard } },
					],
				},
				guardPattern: /"root_parent_child_owner"\."(active|flag)" = \?/g,
			},
		]

		type GuardState = {
			childPresent: boolean
			ownerActive: boolean
			ownerFlag: boolean
			ownerSecret: string
		}
		const matchesGuard = (guard: Input.OptionalWhere, state: GuardState): boolean => {
			if (guard.and && !guard.and.every(item => !item || matchesGuard(item, state))) {
				return false
			}
			if (guard.or && !guard.or.some(item => !!item && matchesGuard(item, state))) {
				return false
			}
			if (guard.not && matchesGuard(guard.not, state)) {
				return false
			}
			for (const fieldName of Object.keys(guard)) {
				if (fieldName === 'and' || fieldName === 'or' || fieldName === 'not') {
					continue
				}
				if (fieldName === 'active' && !state.ownerActive) {
					return false
				}
				if (fieldName === 'flag' && !state.ownerFlag) {
					return false
				}
				if (fieldName === 'secret' && state.ownerSecret !== 'ok') {
					return false
				}
				if (fieldName === 'child' && !state.childPresent) {
					return false
				}
				if (fieldName === 'parent' || fieldName === 'child' || fieldName === 'owner') {
					const nestedGuard = guard[fieldName]
					if (!isOptionalWhere(nestedGuard)) {
						throw new Error(`Expected a nested ${fieldName} guard`)
					}
					if (!matchesGuard(nestedGuard, state)) {
						return false
					}
				}
			}
			return true
		}

		for (const testCase of testCases) {
			const legacy = createLegacyInjection(schema, testCase.entity, testCase.where)
			assert.deepStrictEqual(legacy, testCase.expected)
			const serialized = JSON.stringify(legacy)
			assert.equal(serialized.includes('"active"'), true)
			assert.equal(serialized.includes('"secret"'), false)

			const positiveObligation = legacy.and?.[1]
			if (!isOptionalWhere(positiveObligation)) {
				throw new Error('Expected a positive guard obligation')
			}
			assert.equal(matchesGuard(positiveObligation, { childPresent: false, ownerActive: true, ownerFlag: true, ownerSecret: 'ok' }), false)
			assert.equal(matchesGuard(positiveObligation, { childPresent: true, ownerActive: true, ownerFlag: true, ownerSecret: 'ok' }), true)
			assert.equal(matchesGuard(positiveObligation, { childPresent: true, ownerActive: false, ownerFlag: true, ownerSecret: 'ok' }), false)
			assert.equal(matchesGuard(positiveObligation, { childPresent: true, ownerActive: true, ownerFlag: true, ownerSecret: 'blocked' }), true)

			const jsonRoundTrip: unknown = JSON.parse(serialized)
			if (!isOptionalWhere(jsonRoundTrip)) {
				throw new Error('Expected a where object after JSON round-trip')
			}
			const explicit = createExplicitInjection(schema, testCase.entity, testCase.where)
			for (const variant of [legacy, { ...legacy }, structuredClone(legacy), jsonRoundTrip]) {
				for (const disableOptimizer of [false, true]) {
					const legacySql = createWhere(schema, testCase.where, testCase.entity, variant, disableOptimizer)
					const explicitSql = createWhere(schema, testCase.where, testCase.entity, explicit, disableOptimizer)
					assert.equal(explicitSql, legacySql)
					assert.equal(legacySql.includes('"secret"'), false)
					const matches = legacySql.match(testCase.guardPattern) ?? []
					assert.equal(matches.filter(match => match.includes('"active"')).length, 2)
					assert.equal(matches.filter(match => match.includes('"flag"')).length, 2)
				}
			}
		}
	})

	it('applies a cell guard when the user actually probes an ACL-internal guard field', () => {
		const schema = createSchema(WhereBuilderModel)
		const where: Input.OptionalWhere = { not: { child: { owner: { flag: { eq: true } } } } }
		const legacy = createLegacyInjection(schema, 'GuardParent', where)
		const explicit = createExplicitInjection(schema, 'GuardParent', where)
		assert.equal(JSON.stringify(legacy).includes('"secret"'), true)
		for (const disableOptimizer of [false, true]) {
			const legacySql = createWhere(schema, where, 'GuardParent', legacy, disableOptimizer)
			const explicitSql = createWhere(schema, where, 'GuardParent', explicit, disableOptimizer)
			assert.equal((legacySql.match(/"root_child_owner"\."secret" = \?/g) ?? []).length > 0, true)
			assert.equal((explicitSql.match(/"root_child_owner"\."secret" = \?/g) ?? []).length > 0, true)
		}
	})

	it('keeps raw scalar guard obligations OR-local in legacy output', () => {
		const schema = createSchema(WhereBuilderModel)
		const where: Input.OptionalWhere = {
			not: {
				or: [
					{ secret: { eq: 'probe' } },
					{ name: { eq: 'public' } },
				],
			},
		}
		assert.deepStrictEqual(createLegacyInjection(schema, 'Author', where), {
			and: [
				{
					and: [
						{
							not: {
								or: [
									{ and: [{ secret: { eq: 'probe' } }, { secretVisible: { eq: true } }] },
									{ name: { eq: 'public' } },
								],
							},
						},
						{ or: [{ secretVisible: { eq: true } }, { name: { eq: 'public' } }] },
					],
				},
				{ isPublic: { eq: true } },
			],
		})
	})

	it('keeps separate relation branch guards disjunctive under explicit and legacy NOT OR', () => {
		const where: Input.OptionalWhere = {
			not: {
				or: [
					{ author: { id: { isNull: false } } },
					{ tags: { id: { isNull: false } } },
				],
			},
		}
		for (
			const schema of [
				createSchema(WhereBuilderModel),
				{ ...createSchema(WhereBuilderModel), settings: { useExistsInHasManyFilter: true } },
			]
		) {
			const legacy = createLegacyInjection(schema, 'Article', where)
			assert.deepStrictEqual(legacy, {
				and: [
					{
						not: {
							or: [
								{ author: { and: [{ id: { isNull: false } }, { isPublic: { eq: true } }] } },
								{ tags: { and: [{ id: { isNull: false } }, { name: { eq: 'visible' } }] } },
							],
						},
					},
					{ or: [{ author: { isPublic: { eq: true } } }, { tags: { name: { eq: 'visible' } } }] },
				],
			})
			const positiveObligation = legacy.and?.[1]
			if (!isOptionalWhere(positiveObligation)) {
				throw new Error('Expected a positive guard obligation')
			}
			const matchesReadableBranch = (guard: Input.OptionalWhere, authorReadable: boolean, tagReadable: boolean): boolean => {
				if (guard.and && !guard.and.every(item => !item || matchesReadableBranch(item, authorReadable, tagReadable))) {
					return false
				}
				if (guard.or && !guard.or.some(item => !!item && matchesReadableBranch(item, authorReadable, tagReadable))) {
					return false
				}
				if (guard.not && matchesReadableBranch(guard.not, authorReadable, tagReadable)) {
					return false
				}
				for (const fieldName of Object.keys(guard)) {
					if (fieldName === 'author' && !authorReadable) {
						return false
					}
					if (fieldName === 'tags' && !tagReadable) {
						return false
					}
				}
				return true
			}
			assert.equal(matchesReadableBranch(positiveObligation, true, false), true)
			assert.equal(matchesReadableBranch(positiveObligation, false, true), true)
			assert.equal(matchesReadableBranch(positiveObligation, true, true), true)
			assert.equal(matchesReadableBranch(positiveObligation, false, false), false)
			const explicit = createExplicitInjection(schema, 'Article', where)
			for (const disableOptimizer of [false, true]) {
				const legacySql = createWhere(schema, where, 'Article', legacy, disableOptimizer)
				const explicitSql = createWhere(schema, where, 'Article', explicit, disableOptimizer)
				assert.equal(explicitSql, legacySql)
				const normalized = explicitSql.replaceAll(/\s+/g, ' ').trim()
				assert.equal(normalized.match(/"root_author"\."is_public" = \?/g)?.length, 2)
				assert.equal(normalized.match(/"root_tags"\."name" = \?/g)?.length, 2)
				const positiveAuthorGuard = normalized.lastIndexOf('"root_author"."is_public" = ?')
				const positiveTagGuard = normalized.lastIndexOf('"root_tags"."name" = ?')
				assert.equal(normalized.slice(positiveAuthorGuard, positiveTagGuard).includes(' or '), true)
			}
		}
	})

	it('keeps deep relation-guard OR alternatives disjunctive in legacy and exists modes', () => {
		const schemas: Schema[] = [
			createSchema(WhereBuilderModel),
			{ ...createSchema(WhereBuilderModel), settings: { useExistsInHasManyFilter: true } },
		]
		const where: Input.OptionalWhere = {
			not: {
				articles: {
					or: [
						{ comments: { id: { isNull: false } } },
						{ tags: { id: { isNull: false } } },
					],
				},
			},
		}
		for (const schema of schemas) {
			const injection = leafOnlyRelationInjection(where)
			const optimized = createWhere(schema, where, 'Author', injection)
			const unoptimized = createWhere(schema, where, 'Author', injection, true)
			assert.equal(optimized, unoptimized)

			const normalized = optimized.replaceAll(/\s+/g, ' ').trim()
			assert.equal(normalized.match(/"root_articles_comments"\."is_public" = \?/g)?.length, 2)
			assert.equal(normalized.match(/"root_articles_tags"\."name" = \?/g)?.length, 2)
			const obligation = normalized.slice(normalized.lastIndexOf(') and exists (select 1'))
			assert.equal(obligation.includes('"root_articles_comments"."is_public" = ?'), true)
			assert.equal(obligation.includes('"root_articles_tags"."name" = ?'), true)
			assert.equal(
				obligation.includes('"root_articles_comments"."is_public" = ? or "root_articles_tags"."name" = ?')
					|| obligation.includes(') or exists ('),
				true,
			)
		}
	})

	it('keeps a public primary-null condition with a sibling as an ordinary many-has-many condition', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			tags: {
				id: { isNull: true },
				name: { eq: 'red' },
			},
		}, 'Article')
		compareWhere(
			where,
			`where exists (select 1
				from "__SCHEMA__"."article_tags" as "root_tags_junction_"
				inner join "__SCHEMA__"."tag" as "root_tags" on "root_tags_junction_"."tag_id" = "root_tags"."id"
				where "root_"."id" = "root_tags_junction_"."article_id" and "root_tags"."id" is null and "root_tags"."name" = ?)`,
		)
	})

	it('equivalent absence spellings (and-wrapper, De Morgan, null alias) all lower to NOT EXISTS', () => {
		const schema = createSchema(WhereBuilderModel)
		const expected = ' where not(exists (select 1  from "__SCHEMA__"."article" as "root_articles"  where "root_"."id" = "root_articles"."author_id"))'
		assert.equal(createWhere(schema, { articles: { and: [{ id: { isNull: true } }] } }), expected)
		assert.equal(createWhere(schema, { articles: { not: { id: { isNull: false } } } }), expected)
		assert.equal(createWhere(schema, { articles: { id: { null: true } } }), expected)
	})

	it('keeps a condition-level primary-null sibling as an ordinary condition', () => {
		const schema = createSchema(WhereBuilderModel)
		const where = createWhere(schema, {
			author: {
				id: { not: { isNull: false } },
				name: { eq: 'John' },
			},
		}, 'Article')
		assert.equal(where, ' where not(not("root_author"."id" is null)) and "root_author"."name" = ?')
	})

	it('keeps every operand of a compound primary condition', () => {
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
		assert.equal(where, ' where not("root_"."author_id" is null) and "root_"."author_id" = ?')
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

	it('keeps explicit AND wrappers around a public primary-null sibling condition', () => {
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
		assert.equal(where, ' where not("root_author"."id" is null and "root_author"."name" = ?)')
	})

	it('keeps a mixed condition-level primary OR as an ordinary condition', () => {
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
		assert.equal(where, ' where ("root_"."author_id" is null or "root_"."author_id" = ?)')
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
