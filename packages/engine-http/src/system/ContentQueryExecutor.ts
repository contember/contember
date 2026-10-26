import { Authorizator, ExecutionContainerFactory, JsonContentSchemaBuilder } from '@contember/engine-content-api'
import { execute, validate } from '@contember/graphql-json'
import {
	ContentQueryExecutor,
	ContentQueryExecutorContext,
	ContentQueryExecutorQuery,
	ContentQueryExecutorResult,
} from '@contember/engine-system-api'
import { logger } from '@contember/logger'
import { AllowAllPermissionFactory } from '@contember/schema-utils'
import { GraphQLError, parse } from 'graphql'
import { ContentGraphqlContext } from '../content/ContentGraphqlContext.js'
import { extractOriginalError } from '../graphql/index.js'

export class ContentQueryExecutorImpl implements ContentQueryExecutor {
	constructor(private readonly executionContainerFactory: ExecutionContainerFactory) {}

	public async execute(
		{ db, schema, schemaMeta, databaseMetadata, stage, project, identity }: ContentQueryExecutorContext,
		{ query, variables }: ContentQueryExecutorQuery,
	): Promise<ContentQueryExecutorResult> {
		const permissions = new AllowAllPermissionFactory().create(schema.model, true)
		const authorizator = new Authorizator(permissions, true, false)
		const dataSchema = new JsonContentSchemaBuilder(schema.model, authorizator, authorizator).build()

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
			const document = parse(query)
			const validationErrors = validate(dataSchema.schema, document, { scalars: dataSchema.scalars })
			if (validationErrors.length) {
				return { ok: false, errors: validationErrors.map(formatErrorMessage) }
			}
			const result = await execute({
				schema: dataSchema.schema,
				document,
				resolvers: dataSchema.resolvers,
				scalars: dataSchema.scalars,
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
			&& 'message' in originalError
		? `: ${originalError.message}`
		: ''

	logger.error(e)

	return `Internal error${errorDetails}`
}
