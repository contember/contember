import { c, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { Acl } from '@contember/schema'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { PermissionFactory } from '../../../../../../src'

namespace TestModel {
	export class Author {
		name = def.stringColumn()
		isPublic = def.boolColumn().notNull()
		image = def.manyHasOne(Image, 'authors')
	}
	export class Article {
		title = def.stringColumn()
		isPublic = def.boolColumn().notNull()
		image = def.manyHasOne(Image, 'articles')
	}
	export class Image {
		url = def.stringColumn().notNull()

		articles = def.oneHasMany(Article, 'image')
		authors = def.oneHasMany(Author, 'image')
	}
}
const permissions: Acl.Permissions = {
	Author: {
		predicates: {
			authorPredicate: {
				isPublic: { eq: true },
			},
		},
		operations: {
			read: {
				id: 'authorPredicate',
				name: 'authorPredicate',
				image: 'authorPredicate',
			},
		},
	},
	Article: {
		predicates: {
			articlePredicate: {
				isPublic: { eq: true },
			},
		},
		operations: {
			read: {
				id: 'articlePredicate',
				title: 'articlePredicate',
				image: 'articlePredicate',
			},
		},
	},
	Image: {
		predicates: {
			imagePredicate: {
				or: [
					{ authors: { isPublic: { eq: true } } },
					{ articles: { isPublic: { eq: true } } },
				],
			},
		},
		operations: {
			read: {
				id: 'imagePredicate',
				url: 'imagePredicate',
			},
		},
	},
}

test('predicate with OR', async () => {
	await execute({
		schema: def.createModel(TestModel),
		permissions: permissions,
		variables: {},
		query: GQL`
        query {
          listAuthor {
            id
            image {
            	url
            }
          }
        }`,
		executes: [
			{
				sql: SQL`SELECT "root_"."id" AS "root_id", "root_"."image_id" AS "root_image"
						 FROM "public"."author" AS "root_"
						 WHERE "root_"."is_public" = ?`,
				parameters: [true],
				response: {
					rows: [
						{
							root_id: testUuid(1),
							root_image: testUuid(2),
						},
					],
				},
			},
			{
				sql:
					`select "root_"."id" as "root_id", "root_"."url" as "root_url", "root_"."id" as "root_id"  from "public"."image" as "root_"  where "root_"."id" in (?)`,
				parameters: [testUuid(2)],
				response: {
					rows: [
						{
							root_id: testUuid(2),
							root_url: 'abcd',
						},
					],
				},
			},
		],
		return: {
			data: {
				listAuthor: [
					{
						id: testUuid(1),
						image: {
							url: 'abcd',
						},
					},
				],
			},
		},
	})
})

namespace DoesNotEliminatePrimaryFilterTest {
	export const editor = c.createRole('editor')
	export const articleId = c.createEntityVariable('articleId', 'Article', [editor])

	@c.Allow(editor, {
		when: { id: articleId },
		read: true,
	})
	export class Article {
		title = c.stringColumn().notNull()
		comments = c.oneHasMany(Comment, 'article')
		stats = c.oneHasOneInverse(ArticleStats, 'article')
		discloseAuthor = c.boolColumn().notNull()
	}

	@c.Allow(editor, {
		when: { article: c.canRead('comments') },
		read: true,
	})
	export class Comment {
		text = c.stringColumn().notNull()
		article = c.manyHasOne(Article, 'comments')
	}

	@c.Allow(editor, {
		when: { article: c.canRead('stats') },
		read: true,
	})
	export class ArticleStats {
		views = c.intColumn().notNull()
		article = c.oneHasOne(Article, 'stats')
	}
}

test('does apply primary filter even if relation predicate eliminates it', async () => {
	const schema = createSchema(DoesNotEliminatePrimaryFilterTest)

	const permissions = new PermissionFactory().create(schema, ['editor'])

	await execute({
		schema: schema.model,
		permissions: permissions,
		variables: {
			editor__articleId: { in: [testUuid(1)] },
		},
		query: GQL`
		query {
		  getArticle(by: {id: "${testUuid(1)}"}) {
			title
			comments {
				text
			}
			stats {
				views
			}
		  }
		}`,
		executes: [
			{
				sql:
					SQL`select "root_"."title" as "root_title", "root_"."id" as "root_id", "root_"."id" as "root_id", "root_"."id" as "root_id"  from "public"."article" as "root_"  where "root_"."id" = ? and "root_"."id" in (?)`,
				parameters: [testUuid(1), testUuid(1)],
				response: {
					rows: [
						{
							root_id: testUuid(1),
							root_title: 'Article A',
						},
					],
				},
			},
			{
				sql:
					SQL`select "root_"."article_id" as "__grouping_key", "root_"."text" as "root_text", "root_"."id" as "root_id"  from "public"."comment" as "root_"  where "root_"."article_id" in (?)`,
				parameters: [testUuid(1)],
				response: {
					rows: [],
				},
			},
			{
				sql:
					SQL`select "root_"."article_id" as "root_article", "root_"."views" as "root_views", "root_"."id" as "root_id"  from "public"."article_stats" as "root_"  where "root_"."article_id" in (?)`,
				parameters: [testUuid(1)],
				response: {
					rows: [],
				},
			},
		],
		return: {
			data: {
				getArticle: {
					title: 'Article A',
					comments: [],
					stats: null,
				},
			},
		},
	})
})

// Self-referencing model - Category with parent/children
namespace SelfReferencingModel {
	export const reader = c.createRole('reader')

	@c.Allow(reader, {
		when: { isActive: { eq: true } },
		read: true,
	})
	export class Category {
		name = c.stringColumn().notNull()
		isActive = c.boolColumn().notNull()
		parent = c.manyHasOne(Category, 'children')
		children = c.oneHasMany(Category, 'parent')
	}
}

test('self-referencing: children should have their own predicate applied', async () => {
	const schema = createSchema(SelfReferencingModel)
	const permissions = new PermissionFactory().create(schema, ['reader'])

	await execute({
		schema: schema.model,
		permissions: permissions,
		variables: {},
		query: GQL`
		query {
		  listCategory {
			name
			children {
				name
			}
		  }
		}`,
		executes: [
			{
				// Parent categories - must have isActive = true
				sql:
					SQL`select "root_"."name" as "root_name", "root_"."id" as "root_id", "root_"."id" as "root_id"  from "public"."category" as "root_"  where "root_"."is_active" = ?`,
				parameters: [true],
				response: {
					rows: [
						{ root_id: testUuid(1), root_name: 'Parent Category' },
					],
				},
			},
			{
				// Children - MUST also have isActive = true (their own predicate)
				// The filter should be: parent_id IN (?) AND is_active = true
				sql:
					SQL`select "root_"."parent_id" as "__grouping_key", "root_"."name" as "root_name", "root_"."id" as "root_id"  from "public"."category" as "root_"  where "root_"."parent_id" in (?) and "root_"."is_active" = ?`,
				parameters: [testUuid(1), true],
				response: {
					rows: [
						{ __grouping_key: testUuid(1), root_id: testUuid(2), root_name: 'Child Category' },
					],
				},
			},
		],
		return: {
			data: {
				listCategory: [
					{
						name: 'Parent Category',
						children: [
							{ name: 'Child Category' },
						],
					},
				],
			},
		},
	})
})

// Model with multiple relations between same entities
namespace MultipleRelationsModel {
	export const reader = c.createRole('reader')

	@c.Allow(reader, {
		when: { isPublished: { eq: true } },
		read: true,
	})
	export class Article {
		title = c.stringColumn().notNull()
		isPublished = c.boolColumn().notNull()
		author = c.manyHasOne(Person, 'authoredArticles')
		editor = c.manyHasOne(Person, 'editedArticles')
	}

	@c.Allow(reader, {
		when: { isActive: { eq: true } },
		read: true,
	})
	export class Person {
		name = c.stringColumn().notNull()
		isActive = c.boolColumn().notNull()
		authoredArticles = c.oneHasMany(Article, 'author')
		editedArticles = c.oneHasMany(Article, 'editor')
	}
}

test('multiple relations: articles via author should apply article predicate', async () => {
	const schema = createSchema(MultipleRelationsModel)
	const permissions = new PermissionFactory().create(schema, ['reader'])

	await execute({
		schema: schema.model,
		permissions: permissions,
		variables: {},
		query: GQL`
		query {
		  listPerson {
			name
			authoredArticles {
				title
			}
		  }
		}`,
		executes: [
			{
				// Persons - must have isActive = true
				sql:
					SQL`select "root_"."name" as "root_name", "root_"."id" as "root_id", "root_"."id" as "root_id"  from "public"."person" as "root_"  where "root_"."is_active" = ?`,
				parameters: [true],
				response: {
					rows: [
						{ root_id: testUuid(1), root_name: 'John' },
					],
				},
			},
			{
				// Articles - MUST have isPublished = true (their own predicate)
				sql:
					SQL`select "root_"."author_id" as "__grouping_key", "root_"."title" as "root_title", "root_"."id" as "root_id"  from "public"."article" as "root_"  where "root_"."author_id" in (?) and "root_"."is_published" = ?`,
				parameters: [testUuid(1), true],
				response: {
					rows: [
						{ __grouping_key: testUuid(1), root_id: testUuid(2), root_title: 'Article 1' },
					],
				},
			},
		],
		return: {
			data: {
				listPerson: [
					{
						name: 'John',
						authoredArticles: [
							{ title: 'Article 1' },
						],
					},
				],
			},
		},
	})
})

// Test with back-reference predicate that should be eliminated
namespace BackReferencePredicateModel {
	export const reader = c.createRole('reader')

	@c.Allow(reader, {
		when: { isPublished: { eq: true } },
		read: true,
	})
	export class Article {
		title = c.stringColumn().notNull()
		isPublished = c.boolColumn().notNull()
		comments = c.oneHasMany(Comment, 'article')
	}

	@c.Allow(reader, {
		// Predicate references back to article
		when: { article: { isPublished: { eq: true } } },
		read: true,
	})
	export class Comment {
		text = c.stringColumn().notNull()
		article = c.manyHasOne(Article, 'comments')
	}
}

test('back-reference predicate should be eliminated but join filter preserved', async () => {
	const schema = createSchema(BackReferencePredicateModel)
	const permissions = new PermissionFactory().create(schema, ['reader'])

	await execute({
		schema: schema.model,
		permissions: permissions,
		variables: {},
		query: GQL`
		query {
		  listArticle {
			title
			comments {
				text
			}
		  }
		}`,
		executes: [
			{
				// Articles - must have isPublished = true
				sql:
					SQL`select "root_"."title" as "root_title", "root_"."id" as "root_id", "root_"."id" as "root_id"  from "public"."article" as "root_"  where "root_"."is_published" = ?`,
				parameters: [true],
				response: {
					rows: [
						{ root_id: testUuid(1), root_title: 'Published Article' },
					],
				},
			},
			{
				// Comments - the back-reference predicate (article.isPublished) is eliminated
				// because we already verified article.isPublished when querying articles
				// BUT the join filter (article_id IN) MUST be preserved
				sql:
					SQL`select "root_"."article_id" as "__grouping_key", "root_"."text" as "root_text", "root_"."id" as "root_id"  from "public"."comment" as "root_"  where "root_"."article_id" in (?)`,
				parameters: [testUuid(1)],
				response: {
					rows: [
						{ __grouping_key: testUuid(1), root_id: testUuid(2), root_text: 'Great article!' },
					],
				},
			},
		],
		return: {
			data: {
				listArticle: [
					{
						title: 'Published Article',
						comments: [
							{ text: 'Great article!' },
						],
					},
				],
			},
		},
	})
})

// Deep nesting test
namespace DeepNestingModel {
	export const reader = c.createRole('reader')

	@c.Allow(reader, {
		when: { isActive: { eq: true } },
		read: true,
	})
	export class Company {
		name = c.stringColumn().notNull()
		isActive = c.boolColumn().notNull()
		departments = c.oneHasMany(Department, 'company')
	}

	@c.Allow(reader, {
		when: { company: { isActive: { eq: true } } },
		read: true,
	})
	export class Department {
		name = c.stringColumn().notNull()
		company = c.manyHasOne(Company, 'departments')
		employees = c.oneHasMany(Employee, 'department')
	}

	@c.Allow(reader, {
		when: { department: { company: { isActive: { eq: true } } } },
		read: true,
	})
	export class Employee {
		name = c.stringColumn().notNull()
		department = c.manyHasOne(Department, 'employees')
	}
}

test('deep nesting: predicates should be properly eliminated at each level', async () => {
	const schema = createSchema(DeepNestingModel)
	const permissions = new PermissionFactory().create(schema, ['reader'])

	await execute({
		schema: schema.model,
		permissions: permissions,
		variables: {},
		query: GQL`
		query {
		  listCompany {
			name
			departments {
				name
				employees {
					name
				}
			}
		  }
		}`,
		executes: [
			{
				// Companies - must have isActive = true
				sql:
					SQL`select "root_"."name" as "root_name", "root_"."id" as "root_id", "root_"."id" as "root_id"  from "public"."company" as "root_"  where "root_"."is_active" = ?`,
				parameters: [true],
				response: {
					rows: [
						{ root_id: testUuid(1), root_name: 'Acme Corp' },
					],
				},
			},
			{
				// Departments - back-reference predicate eliminated, join filter preserved
				sql:
					SQL`select "root_"."company_id" as "__grouping_key", "root_"."name" as "root_name", "root_"."id" as "root_id", "root_"."id" as "root_id"  from "public"."department" as "root_"  where "root_"."company_id" in (?)`,
				parameters: [testUuid(1)],
				response: {
					rows: [
						{ __grouping_key: testUuid(1), root_id: testUuid(2), root_name: 'Engineering' },
					],
				},
			},
			{
				// Employees - back-reference predicate eliminated, join filter preserved
				sql:
					SQL`select "root_"."department_id" as "__grouping_key", "root_"."name" as "root_name", "root_"."id" as "root_id"  from "public"."employee" as "root_"  where "root_"."department_id" in (?)`,
				parameters: [testUuid(2)],
				response: {
					rows: [
						{ __grouping_key: testUuid(2), root_id: testUuid(3), root_name: 'Alice' },
					],
				},
			},
		],
		return: {
			data: {
				listCompany: [
					{
						name: 'Acme Corp',
						departments: [
							{
								name: 'Engineering',
								employees: [
									{ name: 'Alice' },
								],
							},
						],
					},
				],
			},
		},
	})
})

// Test filtering with explicit where clause on has-many
namespace FilteringWithWhereModel {
	export const reader = c.createRole('reader')
	export const companyId = c.createEntityVariable('companyId', 'Company', [reader])

	@c.Allow(reader, {
		when: { id: companyId },
		read: true,
	})
	export class Company {
		name = c.stringColumn().notNull()
		projects = c.oneHasMany(Project, 'company')
	}

	@c.Allow(reader, {
		when: { company: c.canRead('projects') },
		read: true,
	})
	export class Project {
		name = c.stringColumn().notNull()
		isActive = c.boolColumn().notNull()
		company = c.manyHasOne(Company, 'projects')
	}
}

// Multi-level back-reference test
namespace MultiLevelBackReferenceModel {
	export const reader = c.createRole('reader')

	@c.Allow(reader, {
		when: { isActive: { eq: true } },
		read: true,
	})
	export class Company {
		name = c.stringColumn().notNull()
		isActive = c.boolColumn().notNull()
		departments = c.oneHasMany(Department, 'company')
	}

	@c.Allow(reader, {
		// Back-reference to company
		when: { company: { isActive: { eq: true } } },
		read: true,
	})
	export class Department {
		name = c.stringColumn().notNull()
		company = c.manyHasOne(Company, 'departments')
		employees = c.oneHasMany(Employee, 'department')
	}

	@c.Allow(reader, {
		// Multi-level back-reference: department -> company
		when: { department: { company: { isActive: { eq: true } } } },
		read: true,
	})
	export class Employee {
		name = c.stringColumn().notNull()
		department = c.manyHasOne(Department, 'employees')
		tasks = c.oneHasMany(Task, 'employee')
	}

	@c.Allow(reader, {
		// Even deeper: employee -> department -> company
		when: { employee: { department: { company: { isActive: { eq: true } } } } },
		read: true,
	})
	export class Task {
		title = c.stringColumn().notNull()
		employee = c.manyHasOne(Employee, 'tasks')
	}
}

test('multi-level back-reference: predicates should be eliminated at each level', async () => {
	const schema = createSchema(MultiLevelBackReferenceModel)
	const permissions = new PermissionFactory().create(schema, ['reader'])

	await execute({
		schema: schema.model,
		permissions: permissions,
		variables: {},
		query: GQL`
		query {
		  listCompany {
			name
			departments {
				name
				employees {
					name
					tasks {
						title
					}
				}
			}
		  }
		}`,
		executes: [
			{
				// Companies - must have isActive = true
				sql:
					SQL`select "root_"."name" as "root_name", "root_"."id" as "root_id", "root_"."id" as "root_id"  from "public"."company" as "root_"  where "root_"."is_active" = ?`,
				parameters: [true],
				response: {
					rows: [
						{ root_id: testUuid(1), root_name: 'Acme Corp' },
					],
				},
			},
			{
				// Departments - back-reference predicate (company.isActive) should be eliminated
				// Only join filter preserved
				sql:
					SQL`select "root_"."company_id" as "__grouping_key", "root_"."name" as "root_name", "root_"."id" as "root_id", "root_"."id" as "root_id"  from "public"."department" as "root_"  where "root_"."company_id" in (?)`,
				parameters: [testUuid(1)],
				response: {
					rows: [
						{ __grouping_key: testUuid(1), root_id: testUuid(2), root_name: 'Engineering' },
					],
				},
			},
			{
				// Employees - multi-level back-reference predicate (department.company.isActive) should be eliminated
				// Only join filter preserved
				sql:
					SQL`select "root_"."department_id" as "__grouping_key", "root_"."name" as "root_name", "root_"."id" as "root_id", "root_"."id" as "root_id"  from "public"."employee" as "root_"  where "root_"."department_id" in (?)`,
				parameters: [testUuid(2)],
				response: {
					rows: [
						{ __grouping_key: testUuid(2), root_id: testUuid(3), root_name: 'Alice' },
					],
				},
			},
			{
				// Tasks - even deeper back-reference predicate should be eliminated
				// Only join filter preserved
				sql:
					SQL`select "root_"."employee_id" as "__grouping_key", "root_"."title" as "root_title", "root_"."id" as "root_id"  from "public"."task" as "root_"  where "root_"."employee_id" in (?)`,
				parameters: [testUuid(3)],
				response: {
					rows: [
						{ __grouping_key: testUuid(3), root_id: testUuid(4), root_title: 'Fix bug' },
					],
				},
			},
		],
		return: {
			data: {
				listCompany: [
					{
						name: 'Acme Corp',
						departments: [
							{
								name: 'Engineering',
								employees: [
									{
										name: 'Alice',
										tasks: [
											{ title: 'Fix bug' },
										],
									},
								],
							},
						],
					},
				],
			},
		},
	})
})

test('user filter on has-many should be preserved alongside join filter', async () => {
	const schema = createSchema(FilteringWithWhereModel)
	const permissions = new PermissionFactory().create(schema, ['reader'])

	await execute({
		schema: schema.model,
		permissions: permissions,
		variables: {
			reader__companyId: { in: [testUuid(1)] },
		},
		query: GQL`
		query {
		  listCompany {
			name
			projects(filter: { isActive: { eq: true } }) {
				name
			}
		  }
		}`,
		executes: [
			{
				sql:
					SQL`select "root_"."name" as "root_name", "root_"."id" as "root_id", "root_"."id" as "root_id"  from "public"."company" as "root_"  where "root_"."id" in (?)`,
				parameters: [testUuid(1)],
				response: {
					rows: [
						{ root_id: testUuid(1), root_name: 'Acme Corp' },
					],
				},
			},
			{
				// Both the join filter (company_id IN) AND the user's filter (is_active = true) should be present
				sql:
					SQL`select "root_"."company_id" as "__grouping_key", "root_"."name" as "root_name", "root_"."id" as "root_id"  from "public"."project" as "root_"  where "root_"."is_active" = ? and "root_"."company_id" in (?)`,
				parameters: [true, testUuid(1)],
				response: {
					rows: [
						{ __grouping_key: testUuid(1), root_id: testUuid(2), root_name: 'Active Project' },
					],
				},
			},
		],
		return: {
			data: {
				listCompany: [
					{
						name: 'Acme Corp',
						projects: [
							{ name: 'Active Project' },
						],
					},
				],
			},
		},
	})
})
