import { createUuidGenerator, testUuid } from './testUuid'
import { graphql, GraphQLSchema } from 'graphql'
import { GQL } from './tags'
import { Identity } from '@contember/engine-common'
import { ApiTester } from './ApiTester'
import { Client } from '@contember/database'
import {
	ResolverContext,
	Schema,
	setupSystemVariables,
	StageBySlugQuery,
	SystemContainer,
	SystemExecutionContainer,
	unnamedIdentity,
} from '@contember/engine-system-api'

export class SystemApiTester {
	private readonly uuidGenerator = createUuidGenerator('a454')

	constructor(
		private readonly db: Client,
		private readonly systemSchema: GraphQLSchema,
		private readonly systemContainer: SystemContainer,
		private readonly systemExecutionContainer: SystemExecutionContainer,
	) {}

	public async querySystem(
		gql: string,
		variables?: { [key: string]: any },
		options: {
			identity?: Identity
			roles?: string[]
			projectRoles?: string[]
		} = {},
	): Promise<any> {
		await setupSystemVariables(this.db, unnamedIdentity, { uuid: this.uuidGenerator })
		const context: ResolverContext = new ResolverContext(
			options.identity ||
				new Identity.StaticIdentity(testUuid(888), options.roles || [Identity.SystemRole.SUPER_ADMIN], {
					[ApiTester.project.slug]: options.projectRoles || [],
				}),
			{},
			this.systemContainer.authorizator,
			this.systemExecutionContainer,
			() => null,
		)

		return await graphql(this.systemSchema, gql, null, context, variables)
	}

	public async diff(baseStage: string, headStage: string): Promise<Schema.DiffResult> {
		const result = await this.querySystem(
			GQL`query($baseStage: String!, $headStage: String!) {
        diff(baseStage: $baseStage, headStage: $headStage) {
          ok
          errors
          result {
            events {
              id
              dependencies
              description
              allowed
              type
            }
          }
        }
      }`,
			{ baseStage, headStage },
		)

		if (!result.data.diff.ok) {
			throw result.data.diff.errors
		}

		return result.data.diff.result
	}

	public async releaseForward(baseStage: string, headStage: string, eventsCount?: number): Promise<void> {
		const diff = await this.querySystem(
			GQL`query($headStage: String!, $baseStage: String!) {
        diff(baseStage: $baseStage, headStage: $headStage) {
          ok
          errors
          result {
            events {
              id
            }
          }
        }
      }`,
			{
				headStage,
				baseStage,
			},
		)
		if (!diff.data.diff.ok) {
			throw diff.data.diff.errors
		}

		const [baseStageObj, headStageObj] = await Promise.all([
			this.systemExecutionContainer.queryHandler.fetch(new StageBySlugQuery(baseStage)),
			this.systemExecutionContainer.queryHandler.fetch(new StageBySlugQuery(headStage)),
		])

		await this.systemExecutionContainer.releaseExecutor.execute(
			{
				identity: new Identity.StaticIdentity(testUuid(666), [Identity.SystemRole.SUPER_ADMIN], {}),
				variables: {},
			},
			baseStageObj!,
			headStageObj!,
			(diff.data.diff.result.events as any[])
				.slice(0, eventsCount || diff.data.diff.result.events.length)
				.map(it => it.id),
		)
	}
}
