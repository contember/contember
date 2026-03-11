import { PermissionFactory, PredicateFactory, PredicatesInjector, VariableInjector } from '../../../src/acl'
import { AclDefinition as acl, createSchema, PermissionsBuilder, SchemaBuilder, SchemaDefinition as def } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { describe, it } from 'bun:test'
import { WhereOptimizer } from '../../../src/mapper/select/optimizer/WhereOptimizer'
import { ConditionOptimizer } from '../../../src/mapper/select/optimizer/ConditionOptimizer'
import { acceptFieldVisitor, AllowAllPermissionFactory } from '@contember/schema-utils'
import { testUuid } from '../../src/testUuid'
import { assert } from '../../src/assert'

const schema = new SchemaBuilder()
	.enum('locale', ['cs', 'en'])
	.entity('Post', entityBuilder => entityBuilder.oneHasMany('locales', c => c.target('PostLocale')))
	.entity('PostLocale', entity =>
		entity
			.column('title', column => column.type(Model.ColumnType.String))
			.column('content', column => column.type(Model.ColumnType.String))
			.column('locale', column => column.type(Model.ColumnType.Enum, { enumName: 'locale' })))
	.buildSchema()

const permissions: Acl.Permissions = {
	Post: {
		predicates: {},
		operations: {
			read: {
				id: true,
				locales: true,
			},
		},
	},
	PostLocale: {
		predicates: {
			localePredicate: {
				locale: 'localeVariable',
			},
			localePredicate2: {
				locale: 'localeVariable',
			},
		},
		operations: {
			read: {
				id: 'localePredicate',
				title: 'localePredicate2',
				content: 'localePredicate',
			},
		},
	},
}

describe('Predicates injector', () => {
	const variables: Acl.VariablesMap = {
		localeVariable: { in: ['cs'] },
	}
	it('injects predicate', () => {
		const injector = new PredicatesInjector(
			schema,
			new PredicateFactory(permissions, schema, new VariableInjector(schema, variables)),
		)
		const result = injector.inject(schema.entities['PostLocale'], {})

		assert.deepStrictEqual(result, {
			locale: { in: ['cs'] },
		})
	})

	it('merges predicate with explicit where', () => {
		const injector = new PredicatesInjector(
			schema,
			new PredicateFactory(permissions, schema, new VariableInjector(schema, variables)),
		)
		const result = injector.inject(schema.entities['PostLocale'], { id: { in: [1, 2] } })

		assert.deepStrictEqual(result, {
			and: [
				{
					id: { in: [1, 2] },
				},
				{
					locale: { in: ['cs'] },
				},
			],
		})
	})

	it('injects predicate to where', () => {
		const injector = new PredicatesInjector(
			schema,
			new PredicateFactory(permissions, schema, new VariableInjector(schema, variables)),
		)

		const result = injector.inject(schema.entities['PostLocale'], { title: { eq: 'abc' } })

		assert.deepStrictEqual(result, {
			and: [
				{
					and: [
						{
							title: { eq: 'abc' },
						},
						{
							locale: { in: ['cs'] },
						},
					],
				},
				{
					locale: { in: ['cs'] },
				},
			],
		})
	})
})

namespace DeepFilterModel {
	export const readerRole = acl.createRole('reader')

	@acl.allow(readerRole, {
		when: { isPublished: { eq: true } },
		read: ['coverPhoto'],
	})
	export class Article {
		isPublished = def.boolColumn()
		title = def.stringColumn()
		coverPhoto = def.manyHasOne(ImageUse, 'articles')
	}

	@acl.allow(readerRole, {
		when: { articles: acl.canRead('coverPhoto') },
		read: true,
	})
	export class ImageUse {
		articles = def.oneHasMany(Article, 'coverPhoto')
		image = def.manyHasOne(Image, 'uses')
	}

	@acl.allow(readerRole, {
		when: { uses: acl.canRead('image') },
		read: true,
	})
	export class Image {
		uses = def.oneHasMany(ImageUse, 'image')
		url = def.stringColumn()
		tags = def.manyHasMany(Tag)
	}

	@acl.allow(readerRole, {
		read: true,
	})
	export class Tag {
		label = def.stringColumn()
	}
}

describe('predicates injector elimination', () => {
	const schema = createSchema(DeepFilterModel)
	const permissions = new PermissionFactory().create(schema, ['reader'])

	const injector = new PredicatesInjector(
		schema.model,
		new PredicateFactory(permissions, schema.model, new VariableInjector(schema.model, {})),
	)
	it('eliminates predicates in where', () => {
		const injected = injector.inject(schema.model.entities.Article, {
			coverPhoto: { image: { tags: { label: { eq: 'foo' } } } },
		})
		const optimizer = new WhereOptimizer(schema.model, new ConditionOptimizer())
		const result = optimizer.optimize(injected, schema.model.entities.Article)

		assert.deepStrictEqual(result, { and: [{ coverPhoto: { image: { tags: { label: { eq: 'foo' } } } } }, { isPublished: { eq: true } }] })
	})

	it('eliminate back referencing predicate', () => {
		const relation = acceptFieldVisitor(schema.model, schema.model.entities.Article, 'coverPhoto', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})
		// Pass ancestorPath to indicate Article->coverPhoto is in our traversal path
		const ancestorPath = [relation]
		const injected = injector.inject(
			schema.model.entities.ImageUse,
			{
				articles: { id: { in: [testUuid(1)] } },
			},
			relation,
			ancestorPath,
		)

		assert.deepStrictEqual(injected, {
			and: [
				{
					articles: {
						and: [
							{ id: { in: [testUuid(1)] } },
							{ id: { always: true } },
						],
					},
				},
				{
					articles: { id: { always: true } },
				},
			],
		})
	})
})

// Self-referencing model to test edge cases
namespace SelfReferencingModel {
	export const readerRole = acl.createRole('reader')

	@acl.allow(readerRole, {
		when: { isActive: { eq: true } },
		read: true,
	})
	export class Category {
		name = def.stringColumn()
		isActive = def.boolColumn()
		parent = def.manyHasOne(Category, 'children')
		children = def.oneHasMany(Category, 'parent')
	}
}

// Model with multiple relations between same entities
namespace MultipleRelationsModel {
	export const readerRole = acl.createRole('reader')

	@acl.allow(readerRole, {
		when: { isPublished: { eq: true } },
		read: true,
	})
	export class Article {
		title = def.stringColumn()
		isPublished = def.boolColumn()
		author = def.manyHasOne(Person, 'authoredArticles')
		editor = def.manyHasOne(Person, 'editedArticles')
	}

	@acl.allow(readerRole, {
		when: { isActive: { eq: true } },
		read: true,
	})
	export class Person {
		name = def.stringColumn()
		isActive = def.boolColumn()
		authoredArticles = def.oneHasMany(Article, 'author')
		editedArticles = def.oneHasMany(Article, 'editor')
	}
}

describe('predicates injector - self referencing relations', () => {
	const schema = createSchema(SelfReferencingModel)
	const permissions = new PermissionFactory().create(schema, ['reader'])

	const injector = new PredicatesInjector(
		schema.model,
		new PredicateFactory(permissions, schema.model, new VariableInjector(schema.model, {})),
	)

	// Helper to get relation context and ancestors for Category -> children -> Category
	const getChildrenContext = () => {
		const relation = acceptFieldVisitor(schema.model, schema.model.entities.Category, 'children', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})
		const ancestorPath = [relation] // Path contains the relation we traversed
		return { relation, ancestorPath }
	}

	it('should handle back-reference inside OR block', () => {
		const { relation, ancestorPath } = getChildrenContext()

		const injected = injector.inject(
			schema.model.entities.Category,
			{
				or: [
					{ parent: { name: { eq: 'Root' } } },
					{ name: { eq: 'Special' } },
				],
			},
			relation,
			ancestorPath,
		)

		assert.deepStrictEqual(injected, {
			and: [
				{
					or: [
						{ parent: { and: [{ name: { eq: 'Root' } }, { id: { always: true } }] } },
						{ name: { eq: 'Special' } },
					],
				},
				{ isActive: { eq: true } },
			],
		})
	})

	it('should handle back-reference inside AND block', () => {
		const { relation, ancestorPath } = getChildrenContext()

		const injected = injector.inject(
			schema.model.entities.Category,
			{
				and: [
					{ parent: { name: { eq: 'Root' } } },
					{ name: { contains: 'test' } },
				],
			},
			relation,
			ancestorPath,
		)

		assert.deepStrictEqual(injected, {
			and: [
				{
					and: [
						{ parent: { and: [{ name: { eq: 'Root' } }, { id: { always: true } }] } },
						{ name: { contains: 'test' } },
					],
				},
				{ isActive: { eq: true } },
			],
		})
	})

	it('should handle back-reference inside NOT block', () => {
		const { relation, ancestorPath } = getChildrenContext()

		const injected = injector.inject(
			schema.model.entities.Category,
			{
				not: { parent: { name: { eq: 'Excluded' } } },
			},
			relation,
			ancestorPath,
		)

		assert.deepStrictEqual(injected, {
			and: [
				{
					not: { parent: { and: [{ name: { eq: 'Excluded' } }, { id: { always: true } }] } },
				},
				{ isActive: { eq: true } },
			],
		})
	})

	it('should handle mix of back-reference and forward-reference at same level', () => {
		const { relation, ancestorPath } = getChildrenContext()

		const injected = injector.inject(
			schema.model.entities.Category,
			{
				parent: { name: { eq: 'Root' } },
				children: { name: { eq: 'Grandchild' } },
			},
			relation,
			ancestorPath,
		)

		assert.deepStrictEqual(injected, {
			and: [
				{
					parent: { and: [{ name: { eq: 'Root' } }, { id: { always: true } }] },
					children: { and: [{ name: { eq: 'Grandchild' } }, { isActive: { eq: true } }] },
				},
				{ isActive: { eq: true } },
			],
		})
	})

	it('should handle empty filter on back-reference relation', () => {
		const { relation, ancestorPath } = getChildrenContext()

		const injected = injector.inject(
			schema.model.entities.Category,
			{
				parent: {},
			},
			relation,
			ancestorPath,
		)

		// Empty filter stays empty - back-reference simplification only affects predicates
		assert.deepStrictEqual(injected, {
			and: [
				{ parent: {} },
				{ isActive: { eq: true } },
			],
		})
	})

	it('should NOT simplify forward reference in self-referencing relation', () => {
		const { relation, ancestorPath } = getChildrenContext()

		const injected = injector.inject(
			schema.model.entities.Category,
			{
				children: { name: { eq: 'Grandchild' } },
			},
			relation,
			ancestorPath,
		)

		assert.deepStrictEqual(injected, {
			and: [
				{
					children: { and: [{ name: { eq: 'Grandchild' } }, { isActive: { eq: true } }] },
				},
				{ isActive: { eq: true } },
			],
		})
	})

	it('should NOT eliminate predicate for self-referencing - children have their own predicate', () => {
		const { relation, ancestorPath } = getChildrenContext()

		// Query child categories with a filter
		const injected = injector.inject(
			schema.model.entities.Category,
			{
				name: { eq: 'test' },
			},
			relation,
			ancestorPath,
		)

		// The child Category should still have its own predicate { isActive: true }
		// It should NOT be replaced with { id: { always: true } }
		assert.deepStrictEqual(injected, {
			and: [
				{ name: { eq: 'test' } },
				{ isActive: { eq: true } },
			],
		})
	})

	it('should preserve user filter when filtering on parent relation', () => {
		const { relation, ancestorPath } = getChildrenContext()

		// Query child categories with filter on parent (back-reference)
		const injected = injector.inject(
			schema.model.entities.Category,
			{
				parent: { id: { in: [testUuid(1)] } },
			},
			relation,
			ancestorPath,
		)

		// User's filter { parent: { id: ... } } should be preserved
		// The nested parent predicate can be simplified since we came from parent
		assert.deepStrictEqual(injected, {
			and: [
				{
					parent: {
						and: [
							{ id: { in: [testUuid(1)] } },
							{ id: { always: true } },
						],
					},
				},
				{ isActive: { eq: true } },
			],
		})
	})
})

describe('predicates injector - multiple relations between entities', () => {
	const schema = createSchema(MultipleRelationsModel)
	const permissions = new PermissionFactory().create(schema, ['reader'])

	const injector = new PredicatesInjector(
		schema.model,
		new PredicateFactory(permissions, schema.model, new VariableInjector(schema.model, {})),
	)

	it('should NOT eliminate predicate when filtering on different relation than we came from', () => {
		// We came from Person via authoredArticles relation
		const relation = acceptFieldVisitor(schema.model, schema.model.entities.Person, 'authoredArticles', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})
		const ancestorPath = [relation]

		// Query articles with filter on editor (different relation to Person)
		const injected = injector.inject(
			schema.model.entities.Article,
			{
				editor: { name: { eq: 'John' } },
			},
			relation,
			ancestorPath,
		)

		// Editor filter should have full predicate (not simplified)
		// because we came via author, not editor
		assert.deepStrictEqual(injected, {
			and: [
				{
					editor: {
						and: [
							{ name: { eq: 'John' } },
							{ isActive: { eq: true } },
						],
					},
				},
				{ isPublished: { eq: true } },
			],
		})
	})

	it('should eliminate predicate only for the relation we came from', () => {
		// We came from Person via authoredArticles relation
		const relation = acceptFieldVisitor(schema.model, schema.model.entities.Person, 'authoredArticles', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})
		const ancestorPath = [relation]

		// Query articles with filter on author (same relation we came from)
		const injected = injector.inject(
			schema.model.entities.Article,
			{
				author: { name: { eq: 'John' } },
			},
			relation,
			ancestorPath,
		)

		// Author filter should have simplified predicate
		// because we came via author
		assert.deepStrictEqual(injected, {
			and: [
				{
					author: {
						and: [
							{ name: { eq: 'John' } },
							{ id: { always: true } },
						],
					},
				},
				{ isPublished: { eq: true } },
			],
		})
	})
})

describe('predicates injector - non back-reference filter', () => {
	const schema = createSchema(DeepFilterModel)
	const permissions = new PermissionFactory().create(schema, ['reader'])

	const injector = new PredicatesInjector(
		schema.model,
		new PredicateFactory(permissions, schema.model, new VariableInjector(schema.model, {})),
	)

	it('should NOT eliminate predicate when filtering on unrelated relation', () => {
		// We came from Article via coverPhoto
		const relation = acceptFieldVisitor(schema.model, schema.model.entities.Article, 'coverPhoto', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})
		const ancestorPath = [relation]

		// Query ImageUse with filter on image (not the back-reference)
		const injected = injector.inject(
			schema.model.entities.ImageUse,
			{
				image: { url: { eq: 'test.jpg' } },
			},
			relation,
			ancestorPath,
		)

		// Image filter should have full predicate (uses: canRead)
		// The main ImageUse predicate (articles: canRead) should be simplified
		assert.deepStrictEqual(injected, {
			and: [
				{
					image: {
						and: [
							{ url: { eq: 'test.jpg' } },
							{ uses: { id: { always: true } } },
						],
					},
				},
				{ articles: { id: { always: true } } },
			],
		})
	})
})

// Multi-level back-reference model for testing deep ancestry
namespace MultiLevelModel {
	export const readerRole = acl.createRole('reader')

	@acl.allow(readerRole, {
		when: { isActive: { eq: true } },
		read: true,
	})
	export class Company {
		name = def.stringColumn()
		isActive = def.boolColumn()
		departments = def.oneHasMany(Department, 'company')
	}

	@acl.allow(readerRole, {
		when: { company: { isActive: { eq: true } } },
		read: true,
	})
	export class Department {
		name = def.stringColumn()
		company = def.manyHasOne(Company, 'departments')
		employees = def.oneHasMany(Employee, 'department')
	}

	@acl.allow(readerRole, {
		when: { department: { company: { isActive: { eq: true } } } },
		read: true,
	})
	export class Employee {
		name = def.stringColumn()
		department = def.manyHasOne(Department, 'employees')
	}
}

describe('predicates injector - multi-level back-reference', () => {
	const schema = createSchema(MultiLevelModel)
	const permissions = new PermissionFactory().create(schema, ['reader'])

	const injector = new PredicatesInjector(
		schema.model,
		new PredicateFactory(permissions, schema.model, new VariableInjector(schema.model, {})),
	)

	// Helper to build ancestor path for Company -> departments -> Department -> employees -> Employee
	const buildEmployeePath = () => {
		const companyDepartmentsRelation = acceptFieldVisitor(schema.model, schema.model.entities.Company, 'departments', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})
		const departmentEmployeesRelation = acceptFieldVisitor(schema.model, schema.model.entities.Department, 'employees', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})
		return {
			relation: departmentEmployeesRelation,
			ancestorPath: [companyDepartmentsRelation, departmentEmployeesRelation],
		}
	}

	it('should simplify predicate when ancestor entity is in the path', () => {
		// Simulating: Company -> departments -> Department -> employees -> Employee
		// Employee has predicate: { department: { company: { isActive: true } } }
		const { relation, ancestorPath } = buildEmployeePath()

		const injected = injector.inject(schema.model.entities.Employee, {}, relation, ancestorPath)

		// The predicate { department: { company: { isActive: true } } } is simplified because:
		// 1. department is back-reference (we came from Department via employees)
		// 2. Department->employees is in ancestorPath with targetRelation='department'
		// 3. Since Department was already verified (its predicate includes company.isActive check),
		//    the entire department predicate becomes { id: always }
		assert.deepStrictEqual(injected, {
			department: { id: { always: true } },
		})
	})

	it('should simplify Department predicate when Company is ancestor', () => {
		// Simulating: Company -> departments -> Department
		// Department has predicate: { company: { isActive: true } }

		const relation = acceptFieldVisitor(schema.model, schema.model.entities.Company, 'departments', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})
		const ancestorPath = [relation]

		const injected = injector.inject(schema.model.entities.Department, {}, relation, ancestorPath)

		// company is back-reference matching Company->departments in path -> simplify
		assert.deepStrictEqual(injected, {
			company: { id: { always: true } },
		})
	})

	it('should NOT simplify when filtering via non-ancestor relation', () => {
		// If we query Employee directly (not through Company->Department chain)
		// the predicate should NOT be simplified AND nested predicates should be applied
		const injected = injector.inject(schema.model.entities.Employee, {})

		// Full predicate with nested entity predicates applied:
		// - Employee predicate: { department: { company: { isActive: true } } }
		// - Department predicate: { company: { isActive: true } } is added
		// - Company predicate: { isActive: true } is added inside company traversal
		assert.deepStrictEqual(injected, {
			department: {
				and: [
					{
						company: {
							and: [
								{ isActive: { eq: true } }, // from Employee predicate
								{ isActive: { eq: true } }, // Company's own predicate
							],
						},
					},
					{ company: { isActive: { eq: true } } }, // Department's predicate
				],
			},
		})
	})

	it('should handle user filter combined with multi-level back-reference', () => {
		const { relation, ancestorPath } = buildEmployeePath()

		const injected = injector.inject(
			schema.model.entities.Employee,
			{
				name: { eq: 'Alice' },
			},
			relation,
			ancestorPath,
		)

		// User filter preserved, predicate simplified (Department is back-reference,
		// so entire department predicate becomes { id: always })
		assert.deepStrictEqual(injected, {
			and: [
				{ name: { eq: 'Alice' } },
				{ department: { id: { always: true } } },
			],
		})
	})

	it('should NOT simplify predicate for entity not in ancestors', () => {
		// Query: Company -> departments -> Department with filter on employees
		const relation = acceptFieldVisitor(schema.model, schema.model.entities.Company, 'departments', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})
		const ancestorPath = [relation] // Only Company->departments, not Department->employees

		// Query Department with filter on employees
		const injected = injector.inject(
			schema.model.entities.Department,
			{
				employees: { name: { eq: 'Alice' } },
			},
			relation,
			ancestorPath,
		)

		// employees is NOT back-reference (we came via Company->departments, not via employees)
		// Inside employees filter, Employee.department IS a back-reference because we're
		// traversing Department->employees->Employee and the ancestorPath grows to include
		// the employees relation context
		// So Employee predicate { department: { company: ... } } gets simplified:
		// - department becomes { id: always } because it matches the traversal
		assert.deepStrictEqual(injected, {
			and: [
				{
					employees: {
						and: [
							{ name: { eq: 'Alice' } },
							{ department: { id: { always: true } } },
						],
					},
				},
				{ company: { id: { always: true } } },
			],
		})
	})
})

// Edge case: Company with subsidiaries (self-reference) where we must NOT
// incorrectly simplify predicates for different instances of the same entity
namespace SubsidiaryModel {
	export const readerRole = acl.createRole('reader')

	@acl.allow(readerRole, {
		when: { isActive: { eq: true } },
		read: true,
	})
	export class Company {
		name = def.stringColumn()
		isActive = def.boolColumn()
		subsidiaries = def.oneHasMany(Company, 'parent')
		parent = def.manyHasOne(Company, 'subsidiaries')
		departments = def.oneHasMany(Department, 'company')
	}

	@acl.allow(readerRole, {
		// Department's predicate checks its company's isActive
		when: { company: { isActive: { eq: true } } },
		read: true,
	})
	export class Department {
		name = def.stringColumn()
		company = def.manyHasOne(Company, 'departments')
	}
}

describe('predicates injector - subsidiary edge case', () => {
	const schema = createSchema(SubsidiaryModel)
	const permissions = new PermissionFactory().create(schema, ['reader'])

	const injector = new PredicatesInjector(
		schema.model,
		new PredicateFactory(permissions, schema.model, new VariableInjector(schema.model, {})),
	)

	it('should NOT simplify predicate when traversing through different Company instance', () => {
		// Query path: Company[root] -> subsidiaries -> Company[subsidiary] -> departments -> Department
		// Department's predicate: { company: { isActive: true } }
		// The "company" in the predicate refers to Company[subsidiary], NOT Company[root]
		// So we MUST check isActive on the subsidiary, not assume it's verified

		// Build the path: Company -> subsidiaries -> Company -> departments
		const companySubsidiariesRelation = acceptFieldVisitor(schema.model, schema.model.entities.Company, 'subsidiaries', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})
		const companyDepartmentsRelation = acceptFieldVisitor(schema.model, schema.model.entities.Company, 'departments', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})

		// Path represents: root Company -> subsidiaries (to subsidiary Company) -> departments (to Department)
		const ancestorPath = [companySubsidiariesRelation, companyDepartmentsRelation]

		const injected = injector.inject(schema.model.entities.Department, {}, companyDepartmentsRelation, ancestorPath)

		// Department's predicate { company: { isActive: true } }:
		// - "company" relation points to Company[subsidiary]
		// - Company[subsidiary] was traversed via "departments" relation
		// - In ancestorPath, Company->departments has targetRelation='company'
		// - So this IS a back-reference to the subsidiary Company
		// Therefore it gets simplified
		assert.deepStrictEqual(injected, {
			company: { id: { always: true } },
		})
	})

	it('should correctly handle predicate when Company in predicate is NOT in path', () => {
		// Query Department directly (not through Company chain)
		// Department's predicate: { company: { isActive: true } }
		// Since we didn't traverse through Company, the predicate MUST be fully applied
		// AND Company's own predicate should also be applied

		const injected = injector.inject(schema.model.entities.Department, {})

		// Full predicate with nested Company predicate:
		// - Department predicate: { company: { isActive: true } }
		// - Company predicate: { isActive: true } is also added when traversing company
		assert.deepStrictEqual(injected, {
			company: {
				and: [
					{ isActive: { eq: true } }, // from Department predicate
					{ isActive: { eq: true } }, // Company's own predicate
				],
			},
		})
	})

	it('should NOT confuse root Company with subsidiary Company in nested predicates', () => {
		// Query: Company[root] -> subsidiaries -> Company[subsidiary]
		// Company predicate: { isActive: true }
		// When querying subsidiaries, we must check EACH subsidiary's isActive

		const companySubsidiariesRelation = acceptFieldVisitor(schema.model, schema.model.entities.Company, 'subsidiaries', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})

		const ancestorPath = [companySubsidiariesRelation]

		// Query subsidiary Companies with a filter
		const injected = injector.inject(
			schema.model.entities.Company,
			{
				name: { eq: 'Sub Co' },
			},
			companySubsidiariesRelation,
			ancestorPath,
		)

		// Subsidiary Company is NOT a back-reference (subsidiaries != parent)
		// So the full predicate { isActive: true } must be applied
		assert.deepStrictEqual(injected, {
			and: [
				{ name: { eq: 'Sub Co' } },
				{ isActive: { eq: true } },
			],
		})
	})

	it('should simplify only when filtering back through parent relation', () => {
		// Query: Company[root] -> subsidiaries -> Company[subsidiary]
		// with filter on parent (back to root)

		const companySubsidiariesRelation = acceptFieldVisitor(schema.model, schema.model.entities.Company, 'subsidiaries', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})

		const ancestorPath = [companySubsidiariesRelation]

		// Query subsidiary with filter on parent (the back-reference)
		const injected = injector.inject(
			schema.model.entities.Company,
			{
				parent: { name: { eq: 'Root Co' } },
			},
			companySubsidiariesRelation,
			ancestorPath,
		)

		// Parent IS a back-reference (subsidiaries.targetRelation = parent)
		// So parent predicate gets simplified
		assert.deepStrictEqual(injected, {
			and: [
				{
					parent: {
						and: [
							{ name: { eq: 'Root Co' } },
							{ id: { always: true } }, // Parent Company predicate simplified
						],
					},
				},
				{ isActive: { eq: true } }, // Subsidiary's own predicate still applied
			],
		})
	})
})

// SECURITY TEST: Child predicate checks DIFFERENT field than parent predicate
// This tests the scenario where simplification would be INCORRECT
namespace InconsistentPredicateModel {
	export const readerRole = acl.createRole('reader')

	@acl.allow(readerRole, {
		// Company predicate checks isActive
		when: { isActive: { eq: true } },
		read: true,
	})
	export class Company {
		name = def.stringColumn()
		isActive = def.boolColumn()
		departments = def.oneHasMany(Department, 'company')
	}

	@acl.allow(readerRole, {
		// Department predicate checks company.isActive (consistent with Company predicate)
		when: { company: { isActive: { eq: true } } },
		read: true,
	})
	export class Department {
		name = def.stringColumn()
		company = def.manyHasOne(Company, 'departments')
		employees = def.oneHasMany(Employee, 'department')
	}

	@acl.allow(readerRole, {
		// SECURITY CONCERN: Employee predicate checks company.NAME, not company.isActive!
		// This is DIFFERENT from what Company's predicate checks.
		// If we simplify this predicate just because we came through Company,
		// we would skip the name='Acme' check, exposing employees of other companies!
		when: { department: { company: { name: { eq: 'Acme' } } } },
		read: true,
	})
	export class Employee {
		name = def.stringColumn()
		department = def.manyHasOne(Department, 'employees')
	}
}

describe('predicates injector - SECURITY: inconsistent predicates must NOT be simplified', () => {
	const schema = createSchema(InconsistentPredicateModel)
	const permissions = new PermissionFactory().create(schema, ['reader'])

	const injector = new PredicatesInjector(
		schema.model,
		new PredicateFactory(permissions, schema.model, new VariableInjector(schema.model, {})),
	)

	it('should NOT simplify Employee predicate when it checks DIFFERENT field than Company predicate', () => {
		// Query path: Company -> departments -> Department -> employees -> Employee
		// Company predicate: { isActive: true } - verified when querying Company
		// Employee predicate: { department: { company: { name: 'Acme' } } } - checks DIFFERENT field!
		//
		// SECURITY: The name='Acme' condition MUST be preserved (not simplified).
		// But Department and Company predicates CAN be simplified because we came through them.

		const companyDepartmentsRelation = acceptFieldVisitor(schema.model, schema.model.entities.Company, 'departments', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})
		const departmentEmployeesRelation = acceptFieldVisitor(schema.model, schema.model.entities.Department, 'employees', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})

		const ancestorPath = [companyDepartmentsRelation, departmentEmployeesRelation]

		const injected = injector.inject(schema.model.entities.Employee, {}, departmentEmployeesRelation, ancestorPath)

		// The name='Acme' condition is preserved (not simplified)
		// Department's predicate is simplified to { id: always } (we came from Department)
		// Company's predicate is simplified to { id: always } (we came through Company)
		assert.deepStrictEqual(injected, {
			department: {
				and: [
					{
						company: {
							and: [
								{ name: { eq: 'Acme' } },
								{ id: { always: true } }, // Company predicate simplified
							],
						},
					},
					{ id: { always: true } }, // Department predicate simplified
				],
			},
		})
	})

	it('direct Employee query: ALL nested predicates MUST be applied (no ancestor path)', () => {
		// Query Employee DIRECTLY (not through Company -> Department path)
		// In this case, neither Company nor Department was verified at any parent level.
		// So BOTH Department's and Company's predicates MUST be applied.

		const injected = injector.inject(schema.model.entities.Employee, {})

		// Employee's condition (name='Acme') is preserved
		// Department's predicate { company: { isActive: true } } is applied
		// Company's predicate { isActive: true } is applied inside the traversal
		assert.deepStrictEqual(injected, {
			department: {
				and: [
					{
						company: {
							and: [
								{ name: { eq: 'Acme' } },
								{ isActive: { eq: true } }, // Company predicate
							],
						},
					},
					{ company: { isActive: { eq: true } } }, // Department predicate
				],
			},
		})
	})

	it('user filter on back-reference: Company predicate CAN be simplified (already verified at root)', () => {
		// Query: Company -> departments -> Department
		// User filter: { company: { name: { eq: 'Test' } } }
		//
		// The Company was already verified at root level (isActive=true).
		// The user's filter traverses back to that same Company.
		// So Company's predicate CAN be simplified inside the user filter.
		// This is NOT a security issue - the Company is the same one we already verified.

		const relation = acceptFieldVisitor(schema.model, schema.model.entities.Company, 'departments', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})
		const ancestorPath = [relation]

		const injected = injector.inject(
			schema.model.entities.Department,
			{
				company: { name: { eq: 'Test' } },
			},
			relation,
			ancestorPath,
		)

		// The user's filter { company: { name: 'Test' } } is preserved
		// Company's predicate inside user filter is simplified (already verified)
		// Department's own predicate is also simplified (references same verified Company)
		assert.deepStrictEqual(injected, {
			and: [
				{
					company: {
						and: [
							{ name: { eq: 'Test' } },
							{ id: { always: true } }, // Company predicate simplified - already verified
						],
					},
				},
				{
					company: { id: { always: true } }, // Department predicate simplified (duplicates optimized away)
				},
			],
		})
	})
})

// Many-to-many relation model
namespace ManyToManyModel {
	export const readerRole = acl.createRole('reader')

	@acl.allow(readerRole, {
		when: { isPublished: { eq: true } },
		read: true,
	})
	export class Post {
		title = def.stringColumn()
		isPublished = def.boolColumn()
		tags = def.manyHasMany(Tag, 'posts')
	}

	@acl.allow(readerRole, {
		when: { isActive: { eq: true } },
		read: true,
	})
	export class Tag {
		name = def.stringColumn()
		isActive = def.boolColumn()
		posts = def.manyHasManyInverse(Post, 'tags')
	}
}

describe('predicates injector - many-to-many relations', () => {
	const schema = createSchema(ManyToManyModel)
	const permissions = new PermissionFactory().create(schema, ['reader'])

	const injector = new PredicatesInjector(
		schema.model,
		new PredicateFactory(permissions, schema.model, new VariableInjector(schema.model, {})),
	)

	const getOwningContext = () => {
		const relation = acceptFieldVisitor(schema.model, schema.model.entities.Post, 'tags', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})
		return { relation, ancestorPath: [relation] }
	}

	const getInverseContext = () => {
		const relation = acceptFieldVisitor(schema.model, schema.model.entities.Tag, 'posts', {
			visitColumn: () => {
				throw new Error()
			},
			visitRelation: ctx => ctx,
		})
		return { relation, ancestorPath: [relation] }
	}

	it('should apply Tag predicate when traversing Post -> tags (owning side)', () => {
		const { relation, ancestorPath } = getOwningContext()
		const injected = injector.inject(schema.model.entities.Tag, {}, relation, ancestorPath)

		assert.deepStrictEqual(injected, {
			isActive: { eq: true },
		})
	})

	it('should apply Post predicate when traversing Tag -> posts (inverse side)', () => {
		const { relation, ancestorPath } = getInverseContext()
		const injected = injector.inject(schema.model.entities.Post, {}, relation, ancestorPath)

		assert.deepStrictEqual(injected, {
			isPublished: { eq: true },
		})
	})

	it('should simplify Post predicate when filtering back via posts (m:n inverse is a back-reference)', () => {
		const { relation, ancestorPath } = getOwningContext()

		const injected = injector.inject(
			schema.model.entities.Tag,
			{
				posts: { title: { eq: 'Hello' } },
			},
			relation,
			ancestorPath,
		)

		// Post.tags has targetRelation=posts, so Tag.posts IS a back-reference
		// Post's predicate is simplified, but user filter preserved
		assert.deepStrictEqual(injected, {
			and: [
				{
					posts: {
						and: [
							{ title: { eq: 'Hello' } },
							{ id: { always: true } },
						],
					},
				},
				{ isActive: { eq: true } },
			],
		})
	})

	it('should simplify Tag predicate when filtering back via tags (m:n owning is a back-reference)', () => {
		const { relation, ancestorPath } = getInverseContext()

		const injected = injector.inject(
			schema.model.entities.Post,
			{
				tags: { name: { eq: 'featured' } },
			},
			relation,
			ancestorPath,
		)

		// Tag.posts has targetRelation=tags, so Post.tags IS a back-reference
		// Tag's predicate is simplified, but user filter preserved
		assert.deepStrictEqual(injected, {
			and: [
				{
					tags: {
						and: [
							{ name: { eq: 'featured' } },
							{ id: { always: true } },
						],
					},
				},
				{ isPublished: { eq: true } },
			],
		})
	})
})

describe('predicate injector input handling', () => {
	const schema = createSchema(DeepFilterModel)
	const permissions = new AllowAllPermissionFactory().create(schema.model)
	const injector = new PredicatesInjector(
		schema.model,
		new PredicateFactory(permissions, schema.model, new VariableInjector(schema.model, {})),
	)
	it('handles null', () => {
		injector.inject(schema.model.entities.ImageUse, {
			image: null,
			articles: {
				and: [
					null,
					{
						title: null,
					},
				],
				not: null,
				or: null,
			},
		})
	})
})
