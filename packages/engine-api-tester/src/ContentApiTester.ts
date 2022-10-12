import { DatabaseContext, SchemaVersionBuilder } from '@contember/engine-system-api'
import { AllowAllPermissionFactory, Providers } from '@contember/schema-utils'
import {
	Authorizator,
	Context as ContentContext,
	ExecutionContainerFactory,
	GraphQlSchemaBuilderFactory,
	MapperContainerFactory,
} from '@contember/engine-content-api'
import { graphql } from 'graphql'
import { TesterStageManager } from './TesterStageManager'
import { Schema } from '@contember/schema'
import { createUuidGenerator } from './testUuid'

export class ContentApiTester {
	private uuidGenerator = createUuidGenerator()

	constructor(
		private readonly db: DatabaseContext,
		private readonly graphqlSchemaBuilderFactory: GraphQlSchemaBuilderFactory,
		private readonly stageManager: TesterStageManager,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly mapperContainerFactoryFactory?: (providers: Providers) => MapperContainerFactory,
	) {}

	public async queryContent(stageSlug: string, gql: string, variables?: { [key: string]: any }): Promise<any> {
		const stage = this.stageManager.getStage(stageSlug)
		const schema = await this.getSchema()
		const model = schema.model
		const permissions = new AllowAllPermissionFactory().create(model)
		const authorizator = new Authorizator(permissions, false)
		const gqlSchemaBuilder = this.graphqlSchemaBuilderFactory.create(model, authorizator)
		const gqlSchema = gqlSchemaBuilder.build()
		const db = this.db.client.forSchema(`stage_${stage.slug}`)

		const providers = {
			uuid: this.uuidGenerator,
			now: () => new Date('2019-09-04 12:00'),
		}
		const executionContainer = new ExecutionContainerFactory(
			providers,
			(this.mapperContainerFactoryFactory ?? (providers => new MapperContainerFactory(providers)))(providers),
		).create({
			schema,
			permissions,
			db,
			identityId: '00000000-0000-0000-0000-000000000000',
			identityVariables: {},
		})
		const context: ContentContext = {
			db,
			identityVariables: {},
			executionContainer,
			timer: async (label, cb) => (cb ? await cb() : (undefined as any)),
		}
		const result = JSON.parse(JSON.stringify(await graphql({
			schema: gqlSchema,
			source: gql,
			contextValue: context,
			variableValues: variables,
		})))
		if (result.errors) {
			throw result.errors[0]
		}
		return result.data
	}

	private async getSchema(): Promise<Schema> {
		return await this.schemaVersionBuilder.buildSchema(this.db)
	}
}
