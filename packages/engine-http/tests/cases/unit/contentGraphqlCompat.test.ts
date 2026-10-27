import { describe, expect, test } from 'bun:test'
import { fetch } from 'bun'
import { once } from 'node:events'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import {
	getIntrospectionQuery,
	GraphQLError,
	GraphQLInputObjectType,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLScalarType,
	GraphQLSchemaConfig,
	GraphQLString,
	Kind,
} from 'graphql'
import { ExecutionContainerFactory, PermissionFactory } from '@contember/engine-content-api'
import { Client, emptyDatabaseMetadata } from '@contember/database'
import { createConnectionMock } from '@contember/database-tester'
import { ForbiddenError } from '@contember/graphql-utils'
import { createLogger, TestLoggerHandler, withLogger } from '@contember/logger'
import { Schema } from '@contember/schema'
import { AllowAllPermissionFactory, c, createSchema } from '@contember/schema-definition'
import { ContentApiSpecificCache } from '../../../src/content/ContentApiSpecificCache.js'
import { ContentGraphqlContext } from '../../../src/content/ContentGraphqlContext.js'
import { ContentQueryHandlerFactory } from '../../../src/content/ContentQueryHandlerFactory.js'
import { GraphQlSchemaFactory, GraphQLSchemaFactoryResult } from '../../../src/content/GraphQlSchemaFactory.js'
import { GraphQLSchemaContributor } from '../../../src/content/GraphQLSchemaContributor.js'
import { ProjectConfig } from '../../../src/project/config.js'

// The snapshots were recorded on the former graphql-js content engine; clients must keep getting the same responses.

const ArticleStatus = c.createEnum('draft', 'published')

class Author {
	name = c.stringColumn().notNull()
	articles = c.oneHasMany(Article, 'author')
}

class Article {
	title = c.stringColumn().notNull().unique()
	status = c.enumColumn(ArticleStatus).notNull().default('draft')
	publishedAt = c.dateTimeColumn()
	author = c.manyHasOne(Author, 'articles')
	tags = c.manyHasMany(Tag)
}

class Tag {
	name = c.stringColumn().notNull()
}

const definition = createSchema({ ArticleStatus, Author, Article, Tag })
const model = definition.model
const readAll = new AllowAllPermissionFactory().create(model, false)

const schema: Schema = {
	...definition,
	acl: {
		roles: {
			admin: { variables: {}, entities: new AllowAllPermissionFactory().create(model, true) },
			reader: {
				variables: {},
				entities: Object.fromEntries(
					Object.entries(readAll).map(([name, it]) => [name, { predicates: {}, operations: { read: it.operations.read } }]),
				),
			},
		},
	},
}

const project: ProjectConfig = {
	slug: 'test',
	name: 'test',
	stages: [{ slug: 'live', name: 'live' }],
	db: { host: 'localhost', port: 5432, user: 'test', password: 'test', database: 'test' },
}

const uploadHeader = new GraphQLObjectType({
	name: 'UploadHeader',
	fields: { key: { type: new GraphQLNonNull(GraphQLString) }, value: { type: new GraphQLNonNull(GraphQLString) } },
})
const uploadUrl = new GraphQLObjectType({
	name: 'UploadUrl',
	fields: {
		url: { type: new GraphQLNonNull(GraphQLString) },
		headers: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(uploadHeader))) },
		size: { type: GraphQLInt, deprecationReason: 'Use headers' },
	},
})
const uploadInput = new GraphQLInputObjectType({
	name: 'UploadInput',
	fields: {
		contentType: { type: GraphQLString },
		size: { type: GraphQLInt, defaultValue: 10, deprecationReason: 'Ignored' },
	},
})

// shaped like the S3 plugin: a graphql-js contribution with deprecated arguments and errors of each kind
const uploadContributor: GraphQLSchemaContributor = {
	getCacheKey: () => 'upload',
	createSchema: (): GraphQLSchemaConfig => ({
		query: new GraphQLObjectType({ name: 'Query', fields: { uploadDummyQuery: { type: GraphQLString } } }),
		mutation: new GraphQLObjectType({
			name: 'Mutation',
			fields: {
				generateUpload: {
					type: new GraphQLNonNull(uploadUrl),
					args: {
						contentType: { type: GraphQLString, deprecationReason: 'Use input.contentType' },
						input: { type: uploadInput },
					},
					resolve: (parent, args: { contentType?: string; input?: { contentType?: string } }) => {
						const contentType = args.input?.contentType ?? args.contentType
						if (contentType === 'forbidden') {
							throw new ForbiddenError('Not allowed to upload forbidden')
						}
						if (contentType === 'invalid') {
							throw new GraphQLError('Invalid content type', { extensions: { code: 'INVALID_CONTENT_TYPE' } })
						}
						if (contentType === 'crash') {
							throw new Error('Unexpected failure')
						}
						return { url: `https://upload/${contentType}`, headers: [{ key: 'Content-Type', value: contentType ?? '' }], size: 1 }
					},
				},
			},
		}),
	}),
}

// serializes and parses asymmetrically, so applying either twice fails
const stamp = new GraphQLScalarType<Date, string>({
	name: 'Stamp',
	serialize: value => {
		if (!(value instanceof Date)) {
			throw new TypeError(`Stamp cannot serialize ${typeof value}`)
		}
		return value.toISOString()
	},
	parseValue: value => {
		if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
			throw new TypeError('Stamp expects an ISO date string')
		}
		return new Date(value)
	},
	parseLiteral: ast => {
		if (ast.kind !== Kind.STRING || Number.isNaN(Date.parse(ast.value))) {
			throw new TypeError('Stamp expects an ISO date string')
		}
		return new Date(ast.value)
	},
})
const reportLine = new GraphQLObjectType({
	name: 'ReportLine',
	fields: {
		label: { type: new GraphQLNonNull(GraphQLString) },
		failing: {
			type: GraphQLString,
			resolve: () => {
				throw new Error('line failed')
			},
		},
		strict: {
			type: new GraphQLNonNull(GraphQLString),
			resolve: () => {
				throw new GraphQLError('strict failed', { extensions: { code: 'STRICT' } })
			},
		},
	},
})
const report = new GraphQLObjectType({
	name: 'Report',
	fields: {
		at: { type: new GraphQLNonNull(stamp) },
		lines: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(reportLine))) },
		maybeLines: { type: new GraphQLList(reportLine) },
		nested: { type: reportLine },
	},
})
const reportInput = new GraphQLInputObjectType({
	name: 'ReportInput',
	fields: { since: { type: stamp }, limit: { type: GraphQLInt, defaultValue: 2 } },
})
const resolveReport = (parent: unknown, args: { since?: unknown; input?: { since?: unknown } }) => {
	const since = args.input?.since ?? args.since
	if (since !== undefined && !(since instanceof Date)) {
		throw new Error('since is not a Date')
	}
	const lines = [{ label: 'a' }, { label: 'b' }]
	return { at: since ?? new Date('2020-01-01'), lines, maybeLines: lines, nested: { label: 'n' } }
}

// output types with nested resolvers, a custom scalar and errors below the root field
const reportContributor: GraphQLSchemaContributor = {
	getCacheKey: () => 'report',
	createSchema: (): GraphQLSchemaConfig => ({
		query: new GraphQLObjectType({
			name: 'Query',
			fields: { report: { type: report, args: { since: { type: stamp }, input: { type: reportInput } }, resolve: resolveReport } },
		}),
		mutation: new GraphQLObjectType({ name: 'Mutation', fields: { touchReport: { type: report, resolve: resolveReport } } }),
	}),
}

const schemaFactory = new GraphQlSchemaFactory(new ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>({}), new PermissionFactory(), [
	uploadContributor,
	reportContributor,
])

const createContext = (role: string): ContentGraphqlContext => {
	const db = new Client(createConnectionMock([]), 'public', {})
	const permissions = new PermissionFactory().createContextual(schema, [role])
	return {
		db,
		identityVariables: {},
		identityId: '00000000-0000-0000-0000-000000000000',
		requestDebug: false,
		project: { slug: project.slug },
		timer: (label, cb) => cb(),
		executionContainer: new ExecutionContainerFactory({ uuid: () => '00000000-0000-0000-0000-000000000000', now: () => new Date('2020-01-01') })
			.create({
				permissions: permissions.root,
				allPermissions: permissions.all,
				schema,
				schemaMeta: { id: 1 },
				db,
				identityVariables: {},
				identityId: '00000000-0000-0000-0000-000000000000',
				systemSchema: 'system',
				stage: { id: '00000000-0000-0000-0000-000000000000', slug: 'live' },
				project: { slug: project.slug },
				schemaDatabaseMetadata: emptyDatabaseMetadata,
				userInfo: { ipAddress: null, userAgent: null },
			}),
	}
}

const request = async (role: string, query: string, variables?: Record<string, unknown>, operationName?: string) => {
	const result = await schemaFactory.create(schema, { projectRoles: [role] }, project)
	const handler = new ContentQueryHandlerFactory(false).create(result.schema)
	const app = new Koa()
	app.use(bodyParser())
	app.use(async context => {
		await withLogger(
			createLogger(new TestLoggerHandler()),
			() => handler({ request: context.request, response: context.response, createContext: () => createContext(role) }),
		)
	})
	const server = app.listen(0, '127.0.0.1')
	try {
		await once(server, 'listening')
		const address = server.address()
		if (!address || typeof address === 'string') {
			throw new Error('Expected a TCP listener')
		}
		const response = await fetch(`http://127.0.0.1:${address.port}/`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query, variables, operationName }),
		})
		return { status: response.status, body: await response.json() }
	} finally {
		await new Promise<void>((resolve, reject) => {
			server.close(error => error ? reject(error) : resolve())
			server.closeAllConnections()
		})
	}
}

const introspectionQuery = getIntrospectionQuery({
	descriptions: true,
	specifiedByUrl: true,
	directiveIsRepeatable: true,
	schemaDescription: true,
	inputValueDeprecation: true,
})

const cases: Record<string, [query: string, variables?: Record<string, unknown>, operationName?: string]> = {
	'unknown field with suggestions': ['{ listArticl { id } }'],
	'unknown field on entity': ['{ listArticle { id nope } }'],
	'unknown argument': ['{ listArticle(nope: 1) { id } }'],
	'invalid enum literal': ['{ listArticle(orderBy: [{ title: up }]) { id } }'],
	'invalid enum value in filter': ['{ listArticle(filter: { status: { eq: archived } }) { id } }'],
	'variable of wrong type': ['query($a: Int) { listArticle(limit: $a) { id } }', { a: 'x' }],
	'required variable not provided': ['query($a: Int!) { listArticle(limit: $a) { id } }', {}],
	'null for a non-null variable': ['query($id: UUID!) { getArticle(by: { id: $id }) { id } }', { id: null }],
	'invalid UUID variable': ['query($id: UUID!) { getArticle(by: { id: $id }) { id } }', { id: 'nope' }],
	'invalid UUID literal': ['{ getArticle(by: { id: "nope" }) { id } }'],
	'invalid DateTime variable': ['query($d: DateTime) { listArticle(filter: { publishedAt: { gte: $d } }) { id } }', { d: 'yesterday' }],
	'wrong literal type': ['{ getArticle(by: { id: 123 }) { id } }'],
	'unknown input field': ['{ listArticle(filter: { nope: { eq: 1 } }) { id } }'],
	'unused variable': ['query($a: Int) { listArticle { id } }'],
	'undefined variable': ['{ listArticle(limit: $a) { id } }'],
	'unknown variable type': ['query($a: Nope) { listArticle { id } }'],
	'selection on a scalar': ['{ listArticle { id { x } } }'],
	'missing selection': ['{ listArticle }'],
	'fragment on a scalar': ['{ listArticle { ...F } } fragment F on String { x }'],
	'unknown fragment': ['{ listArticle { ...F } }'],
	'unused fragment': ['{ listArticle { id } } fragment F on Article { id }'],
	'fragment on a wrong type': ['{ listArticle { ...F } } fragment F on Tag { id }'],
	'fragment cycle': ['{ listArticle { ...F } } fragment F on Article { ...G } fragment G on Article { ...F }'],
	'duplicate operation name': ['query A { listArticle { id } } query A { listArticle { id } }'],
	'anonymous operation among named': ['{ listArticle { id } } query A { listArticle { id } }'],
	'conflicting aliases': ['{ a: listArticle(limit: 1) { id } a: listArticle(limit: 2) { id } }'],
	'conflicting field names': ['{ listArticle { id: title id } }'],
	'duplicate argument': ['{ listArticle(limit: 1, limit: 2) { id } }'],
	'unknown directive': ['{ listArticle @nope { id } }'],
	'missing required argument': ['{ getArticle { id } }'],
	'subscription': ['subscription { listArticle { id } }'],
	'several operations without a name': ['query A { __typename } query B { __typename }'],
	'unknown operation name': ['query A { __typename }', undefined, 'B'],
	'skipped field': ['{ listArticle @skip(if: true) { id } _info { description } }'],
	'typename': ['{ __typename }'],
	'mutation on a read-only role': ['mutation { createArticle(data: { title: "x" }) { ok } }'],
	'contribution with aliases, fragments and variables': [
		'mutation($type: String) { first: generateUpload(input: { contentType: $type }) { ...U } second: generateUpload(contentType: "b") { url } } fragment U on UploadUrl { url headers { key value } size }',
		{ type: 'a' },
	],
	'contribution argument of wrong type': ['mutation { generateUpload(contentType: 1) { url } }'],
	'contribution forbidden error': ['mutation { generateUpload(contentType: "forbidden") { url } }'],
	'contribution error with extensions': ['mutation { generateUpload(contentType: "invalid") { url } }'],
	'contribution unexpected error': ['mutation { generateUpload(contentType: "crash") { url } }'],
	'contribution custom scalar output': ['{ report { at } }'],
	'contribution custom scalar variable': ['query($s: Stamp) { report(since: $s) { at } }', { s: '2021-05-05T00:00:00.000Z' }],
	'contribution custom scalar in an input variable': ['query($i: ReportInput) { report(input: $i) { at } }', {
		i: { since: '2021-05-05T00:00:00.000Z' },
	}],
	'contribution custom scalar literal': ['{ report(since: "2021-05-05T00:00:00.000Z") { at } }'],
	'contribution invalid custom scalar variable': ['query($s: Stamp) { report(since: $s) { at } }', { s: 'nope' }],
	'contribution nested nullable error': ['{ report { lines { label failing } } }'],
	'contribution non-null error bubbling to a nullable list item': ['{ report { maybeLines { label strict } } }'],
	'contribution non-null error bubbling through a non-null list': ['{ report { at lines { label strict } } }'],
	'contribution several errors': ['{ report { lines { failing } nested { failing } } }'],
	'contribution error next to other fields': ['{ __typename r: report { nested { label failing } } uploadDummyQuery }'],
	'contribution under the mutation query field': ['mutation { query { report { at } } }'],
	'contribution mutation': ['mutation { touchReport { at nested { failing } } }'],
	'contribution in a query transaction': ['{ transaction { report { at } } }'],
	'contribution in a mutation transaction': ['mutation { transaction { ok touchReport { at } } }'],
}

describe('content GraphQL responses match graphql-js', () => {
	test('introspection', async () => {
		expect(await request('admin', introspectionQuery)).toMatchSnapshot()
	})
	for (const role of ['admin', 'reader']) {
		for (const [name, [query, variables, operationName]] of Object.entries(cases)) {
			test(`${role}: ${name}`, async () => {
				expect(await request(role, query, variables, operationName)).toMatchSnapshot()
			})
		}
	}
})
