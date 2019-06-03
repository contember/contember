import { setupSystemVariables } from '../../src/system-api/SystemVariablesSetupHelper'
import AllowAllPermissionFactory from '../../src/acl/AllowAllPermissionFactory'
import { formatSchemaName } from '../../src/system-api/model/helpers/stageHelpers'
import ExecutionContainerFactory from '../../src/content-api/graphQlResolver/ExecutionContainerFactory'
import { Context as ContentContext } from '../../src/content-api/types'
import { maskErrors } from 'graphql-errors'
import { graphql } from 'graphql'
import Client from '../../src/core/database/Client'
import GraphQlSchemaBuilderFactory from '../../src/content-api/graphQLSchema/GraphQlSchemaBuilderFactory'
import TesterStageManager from './TesterStageManager'
import { Schema } from 'cms-common'
import SchemaVersionBuilder from '../../src/content-schema/SchemaVersionBuilder'
import { emptySchema } from '../../src/content-schema/schemaUtils'

export default class ContentApiTester {
	constructor(
		private readonly db: Client,
		private readonly graphqlSchemaBuilderFactory: GraphQlSchemaBuilderFactory,
		private readonly stageManager: TesterStageManager,
		private readonly schemaVersionBuilder: SchemaVersionBuilder
	) {}

	public async queryContent(stageSlug: string, gql: string, variables?: { [key: string]: any }): Promise<any> {
		await setupSystemVariables(this.db, '11111111-1111-1111-1111-111111111111')
		const stage = this.stageManager.getStage(stageSlug)
		const schema = await this.getSchema()
		const model = schema.model
		const permissions = new AllowAllPermissionFactory().create(model)
		const gqlSchemaBuilder = this.graphqlSchemaBuilderFactory.create(model, permissions)
		const gqlSchema = gqlSchemaBuilder.build()
		const db = this.db.forSchema(formatSchemaName(stage))

		const executionContainer = new ExecutionContainerFactory(schema, permissions).create({
			db,
			identityVariables: {},
		})
		const context: ContentContext = {
			db,
			identityVariables: {},
			executionContainer,
			errorHandler: () => null,
			timer: async (label, cb) => (cb ? await cb() : (undefined as any)),
		}
		maskErrors(gqlSchema, err => {
			console.error(err)
			process.exit(1)
		})
		const result = await graphql(gqlSchema, gql, null, context, variables)
		if (result.errors) {
			result.errors.map(it => console.error(it))
		}
		return result.data
	}

	private async getSchema(): Promise<Schema> {
		const version = this.stageManager.getMigrationVersion()
		return version ? await this.schemaVersionBuilder.buildSchema(version) : emptySchema
	}
}
