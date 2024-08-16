import {
	ContentQueryExecutor,
	ContentQueryExecutorContext,
	ContentQueryExecutorQuery,
	ContentQueryExecutorResult,
} from '@contember/engine-system-api'
import { Authorizator, ExecutionContainerFactory, GraphQlSchemaBuilderFactory } from '@contember/engine-content-api'
import { AllowAllPermissionFactory } from '@contember/schema-utils'
import { graphql, GraphQLError } from 'graphql'
import { ExtendedGraphqlContext } from '../content'
import { extractOriginalError } from '../graphql'
import { logger } from '@contember/logger'

export class ContentQueryExecutorImpl implements ContentQueryExecutor {
	constructor(
		private readonly executionContainerFactory: ExecutionContainerFactory,
		private readonly graphqlSchemaBuilderFactory: GraphQlSchemaBuilderFactory,
	) {
	}

	public async execute({ db, schema, schemaMeta, databaseMetadata, stage, project, identity }: ContentQueryExecutorContext, { query, variables }: ContentQueryExecutorQuery): Promise<ContentQueryExecutorResult> {
		const permissions = new AllowAllPermissionFactory().create(schema.model, true)
		const authorizator = new Authorizator(permissions, true)
		const dataSchemaBuilder = this.graphqlSchemaBuilderFactory.create(schema.model, authorizator)
		const dataSchema = dataSchemaBuilder.build()

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
		})

		const ctx: ExtendedGraphqlContext = {
			db: db.client.forSchema(stage.schema),
			identityVariables: {},
			identityId,
			requestDebug: false,
			executionContainer,
			timer: (label, cb) => cb(),
		}

		try {
			const result = await graphql({
				schema: dataSchema,
				source: query,
				variableValues: variables,
				contextValue: ctx,
			})
			if (result.errors?.length) {
				return { ok: false, errors: result.errors.map(formatErrorMessage) }
			}
			return { ok: true, result }
		} catch (e) {
			return { ok: false, errors: [formatErrorMessage(e)] }
		}
	}
}

const formatErrorMessage = (e: any): string => {
	const originalError = extractOriginalError(e)
	if (originalError instanceof GraphQLError) {
		return originalError.message
	}
	const errorDetails = typeof originalError === 'object'
		&& originalError !== null
		&& 'message' in originalError ? `: ${originalError.message}` : ''

	logger.error(e)

	return `Internal error${errorDetails}`
}
