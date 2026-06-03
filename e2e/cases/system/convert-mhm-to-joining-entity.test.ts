import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester.js'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { Migration, VERSION_LATEST } from '@contember/schema-migrations'
import { Model } from '@contember/schema'

namespace BidirectionalModel {
	export class Post {
		title = def.stringColumn()
		categories = def.manyHasMany(Category, 'posts')
	}

	export class Category {
		title = def.stringColumn()
		posts = def.manyHasManyInverse(Post, 'categories')
	}
}

namespace UnidirectionalModel {
	export class Post {
		title = def.stringColumn()
		categories = def.manyHasMany(Category)
	}

	export class Category {
		title = def.stringColumn()
	}
}

/**
 * Builds the explicit joining-entity shape + the `convertManyHasManyToJoiningEntity` modification
 * for a given M:N owning relation, reusing the junction table's real (generated) column names.
 */
const buildConvertModification = (
	schema: Model.Schema,
	opts: { entityName: string; fieldName: string; joiningEntityName: string; withTargetInverse: boolean },
): Migration.Modification[] => {
	const owningEntity = schema.entities[opts.entityName]
	const relation = owningEntity.fields[opts.fieldName] as Model.ManyHasManyOwningRelation
	const joiningTable = relation.joiningTable
	const target = relation.target

	const joiningEntity = {
		name: opts.joiningEntityName,
		primary: 'id',
		primaryColumn: 'id',
		tableName: joiningTable.tableName,
		eventLog: { enabled: true },
		unique: [],
		indexes: [],
		fields: {
			id: {
				name: 'id',
				columnName: 'id',
				type: Model.ColumnType.Uuid,
				columnType: 'uuid',
				nullable: false,
			} satisfies Model.AnyColumn,
			post: {
				name: 'post',
				type: Model.RelationType.ManyHasOne,
				target: opts.entityName,
				inversedBy: 'postCategories',
				nullable: false,
				joiningColumn: joiningTable.joiningColumn,
			} satisfies Model.ManyHasOneRelation,
			category: {
				name: 'category',
				type: Model.RelationType.ManyHasOne,
				target,
				...(opts.withTargetInverse ? { inversedBy: 'postCategories' } : {}),
				nullable: false,
				joiningColumn: joiningTable.inverseJoiningColumn,
			} satisfies Model.ManyHasOneRelation,
		},
	}

	const sourceInverseSide: Model.OneHasManyRelation = {
		name: 'postCategories',
		type: Model.RelationType.OneHasMany,
		target: opts.joiningEntityName,
		ownedBy: 'post',
	}
	const targetInverseSide: Model.OneHasManyRelation = {
		name: 'postCategories',
		type: Model.RelationType.OneHasMany,
		target: opts.joiningEntityName,
		ownedBy: 'category',
	}

	return [{
		modification: 'convertManyHasManyToJoiningEntity',
		entityName: opts.entityName,
		fieldName: opts.fieldName,
		joiningEntity,
		sourceInverseSide,
		...(opts.withTargetInverse ? { targetInverseSide } : {}),
	} as unknown as Migration.Modification]
}

test('System API: convert bidirectional many-has-many to a joining entity (preserves data)', async () => {
	const schema = createSchema(BidirectionalModel)
	const tester = await createTester(schema)

	// seed a Post linked to two Categories through the implicit junction table
	const seed = await tester(gql`
		mutation {
			createPost(data: {
				title: "Hello"
				categories: [
					{ create: { title: "A" } }
					{ create: { title: "B" } }
				]
			}) {
				ok
				node { id categories { id title } }
			}
		}
	`).expect(200)
	expect(seed.body.data.createPost.ok).toBe(true)
	const postId = seed.body.data.createPost.node.id
	expect(seed.body.data.createPost.node.categories).toHaveLength(2)

	const modifications = buildConvertModification(schema.model, {
		entityName: 'Post',
		fieldName: 'categories',
		joiningEntityName: 'PostCategory',
		withTargetInverse: true,
	})

	// This must succeed. Before the fix, the migration re-created the still-existing
	// `log_event_trx` constraint trigger and failed with "trigger already exists".
	await tester.migrate(modifications, '2024-08-01-120000-convert-mhm')

	// existing rows are preserved and now queryable through the new joining entity
	const afterPost = await tester(
		gql`
			query($id: UUID!) {
				getPost(by: { id: $id }) {
					postCategories { id category { title } }
				}
			}
		`,
		{ variables: { id: postId } },
	).expect(200)
	const links = afterPost.body.data.getPost.postCategories
	expect(links).toHaveLength(2)
	expect(links.map((it: any) => it.category.title).sort()).toEqual(['A', 'B'])

	// the join-uniqueness constraint is enforced (schema/DB stay in sync): re-linking
	// the same (post, category) pair must be rejected.
	const firstCategory = await tester(
		gql`
			query($id: UUID!) {
				getPost(by: { id: $id }) { postCategories { category { id } } }
			}
		`,
		{ variables: { id: postId } },
	).expect(200)
	const existingCategoryId = firstCategory.body.data.getPost.postCategories[0].category.id
	const dup = await tester(
		gql`
			mutation($postId: UUID!, $categoryId: UUID!) {
				createPostCategory(data: {
					post: { connect: { id: $postId } }
					category: { connect: { id: $categoryId } }
				}) {
					ok
					errors { type }
				}
			}
		`,
		{ variables: { postId, categoryId: existingCategoryId } },
	).expect(200)
	expect(dup.body.data.createPostCategory.ok).toBe(false)
})

test('System API: convert unidirectional many-has-many to a joining entity', async () => {
	const schema = createSchema(UnidirectionalModel)
	const tester = await createTester(schema)

	const seed = await tester(gql`
		mutation {
			createPost(data: {
				title: "Solo"
				categories: [{ create: { title: "X" } }]
			}) {
				ok
				node { id }
			}
		}
	`).expect(200)
	expect(seed.body.data.createPost.ok).toBe(true)
	const postId = seed.body.data.createPost.node.id

	const modifications = buildConvertModification(schema.model, {
		entityName: 'Post',
		fieldName: 'categories',
		joiningEntityName: 'PostCategory',
		// unidirectional: Category has no inverse relation, so no target inverse side is added
		withTargetInverse: false,
	})

	await tester.migrate(modifications, '2024-08-01-130000-convert-mhm-uni')

	const afterPost = await tester(
		gql`
			query($id: UUID!) {
				getPost(by: { id: $id }) {
					postCategories { category { title } }
				}
			}
		`,
		{ variables: { id: postId } },
	).expect(200)
	expect(afterPost.body.data.getPost.postCategories).toHaveLength(1)
	expect(afterPost.body.data.getPost.postCategories[0].category.title).toBe('X')
})
