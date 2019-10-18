import { formatSchemaName, setupSystemVariables } from '@contember/engine-system-api'
import { SchemaVersionBuilder } from '@contember/schema-migrations'
import { AllowAllPermissionFactory } from '@contember/schema-definition'
import { Client } from '@contember/database'
import {
	Context as ContentContext,
	GraphQlSchemaBuilderFactory,
	ExecutionContainerFactory,
} from '@contember/engine-content-api'
import { graphql } from 'graphql'
import { TesterStageManager } from './TesterStageManager'
import { Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import { createUuidGenerator } from './testUuid'
export class ContentApiTester {
	private trxUuidGenerator = createUuidGenerator('a453')
	private uuidGenerator = createUuidGenerator()

	constructor(
		private readonly db: Client,
		private readonly graphqlSchemaBuilderFactory: GraphQlSchemaBuilderFactory,
		private readonly stageManager: TesterStageManager,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {}

	public async queryContent(stageSlug: string, gql: string, variables?: { [key: string]: any }): Promise<any> {
		await setupSystemVariables(this.db, '11111111-1111-1111-1111-111111111111', { uuid: this.trxUuidGenerator })
		const stage = this.stageManager.getStage(stageSlug)
		const schema = await this.getSchema()
		const model = schema.model
		const permissions = new AllowAllPermissionFactory().create(model)
		const gqlSchemaBuilder = this.graphqlSchemaBuilderFactory.create(model, permissions)
		const gqlSchema = gqlSchemaBuilder.build()
		const db = this.db.forSchema(formatSchemaName(stage))

		const executionContainer = new ExecutionContainerFactory(schema, permissions, {
			uuid: this.uuidGenerator,
			now: () => new Date('2019-09-04 12:00'),
		}).create({
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
		const result = await graphql(gqlSchema, gql, null, context, variables)
		if (result.errors) {
			throw result.errors[0]
		}
		return result.data
	}

	private async getSchema(): Promise<Schema> {
		const version = this.stageManager.getMigrationVersion()
		return version ? await this.schemaVersionBuilder.buildSchema(version) : emptySchema
	}
}
