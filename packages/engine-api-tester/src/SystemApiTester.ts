import { createUuidGenerator, testUuid } from './testUuid'
import { graphql, GraphQLSchema } from 'graphql'
import {
	DatabaseContext,
	Identity,
	ProjectConfig,
	setupSystemVariables,
	SystemContainer,
	unnamedIdentity,
} from '@contember/engine-system-api'
import { ProjectRole } from '@contember/schema'

export class SystemApiTester {
	private readonly uuidGenerator = createUuidGenerator('a454')

	constructor(
		private readonly db: DatabaseContext,
		private readonly project: ProjectConfig,
		private readonly systemSchema: GraphQLSchema,
		private readonly systemContainer: SystemContainer,
	) {}

	public async querySystem(
		gql: string,
		variables?: { [key: string]: any },
		options: {
			identity?: Identity
			roles?: string[]
		} = {},
	): Promise<any> {
		await setupSystemVariables(this.db.client, unnamedIdentity, { uuid: this.uuidGenerator })
		const identity = options.identity || new Identity(testUuid(888), options.roles || [ProjectRole.ADMIN])

		const context = await this.systemContainer.resolverContextFactory.create(this.db, this.project, identity, {})

		const result = await graphql(this.systemSchema, gql, null, context, variables)
		if (result.errors) {
			throw result.errors.length === 1 ? result.errors[0] : result.errors
		}

		return JSON.parse(JSON.stringify(result))
	}
}
