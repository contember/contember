import {
	Authorizator,
	ExecutionContainerFactory,
	GraphQlSchemaBuilderFactory,
	JsonContentSchema,
	JsonContentSchemaBuilder,
} from '@contember/engine-content-api'
import { execute, validate } from '@contember/graphql-json'
import {
	ContentQueryExecutor,
	ContentQueryExecutorContext,
	ContentQueryExecutorQuery,
	ContentQueryExecutorResult,
} from '@contember/engine-system-api'
import { logger } from '@contember/logger'
import { AllowAllPermissionFactory } from '@contember/schema-utils'
import { ExecutionResult, graphql, GraphQLError, parse } from 'graphql'
import { ContentGraphQLEngineResolver, ContentGraphQLSchema } from '../content/ContentGraphQLEngine.js'
import { ContentGraphqlContext } from '../content/ContentGraphqlContext.js'
import { extractOriginalError } from '../graphql/index.js'

export class ContentQueryExecutorImpl implements ContentQueryExecutor {
	constructor(
		private readonly executionContainerFactory: ExecutionContainerFactory,
		private readonly graphqlSchemaBuilderFactory: GraphQlSchemaBuilderFactory,
		private readonly engineResolver: ContentGraphQLEngineResolver = new ContentGraphQLEngineResolver(),
	) {
	}

	public async execute(
		{ db, schema, schemaMeta, databaseMetadata, stage, project, identity }: ContentQueryExecutorContext,
		{ query, variables }: ContentQueryExecutorQuery,
	): Promise<ContentQueryExecutorResult> {
		const permissions = new AllowAllPermissionFactory().create(schema.model, true)
		const authorizator = new Authorizator(permissions, true, false)
		const dataSchema: ContentGraphQLSchema = this.engineResolver.resolve(project.slug) === 'graphql-js'
			? { engine: 'graphql-js', schema: this.graphqlSchemaBuilderFactory.create(schema.model, authorizator, authorizator).build() }
			: { engine: 'graphql-json', schema: new JsonContentSchemaBuilder(schema.model, authorizator, authorizator).build() }

		const identityId = identity.id

		const executionContainer = this.executionContainerFactory.create({
			db: db.client.forSchema(stage.schema),
			identityVariables: {},
			identityId,
			schema,
			schemaMeta,
			schemaDatabaseMetadata: databaseMetadata,
			permissions,
			systemSchema: project.systemSchema,
			stage,
			project: project,
			userInfo: {
				ipAddress: null,
				userAgent: null,
			},
		})

		const ctx: ContentGraphqlContext = {
			project,
			db: db.client.forSchema(stage.schema),
			identityVariables: {},
			identityId,
			requestDebug: false,
			executionContainer,
			timer: (label, cb) => cb(),
		}

		try {
			const result = dataSchema.engine === 'graphql-js'
				? await graphql({
					schema: dataSchema.schema,
					source: query,
					variableValues: variables,
					contextValue: ctx,
				})
				: await this.executeGraphQLJson(dataSchema.schema, query, variables, ctx)
			if (result.errors?.length) {
				return { ok: false, errors: result.errors.map(formatErrorMessage) }
			}
			return { ok: true, result }
		} catch (e) {
			return { ok: false, errors: [formatErrorMessage(e)] }
		}
	}

	private async executeGraphQLJson(
		dataSchema: JsonContentSchema,
		query: string,
		variables: Record<string, unknown> | undefined,
		ctx: ContentGraphqlContext,
	): Promise<Pick<ExecutionResult, 'data' | 'errors'>> {
		const document = parse(query)
		const validationErrors = validate(dataSchema.schema, document, { scalars: dataSchema.scalars })
		if (validationErrors.length) {
			return { errors: validationErrors }
		}
		return await execute({
			schema: dataSchema.schema,
			document,
			resolvers: dataSchema.resolvers,
			scalars: dataSchema.scalars,
			variableValues: variables,
			contextValue: ctx,
		})
	}
}

const formatErrorMessage = (e: any): string => {
	const originalError = extractOriginalError(e)
	if (originalError instanceof GraphQLError) {
		return originalError.message
	}
	const errorDetails = typeof originalError === 'object'
			&& originalError !== null
			&& 'message' in originalError
		? `: ${originalError.message}`
		: ''

	logger.error(e)

	return `Internal error${errorDetails}`
}
