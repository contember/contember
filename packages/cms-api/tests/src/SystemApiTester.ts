import { setupSystemVariables, unnamedIdentity } from '../../src/system-api/SystemVariablesSetupHelper'
import ResolverContext from '../../src/system-api/resolvers/ResolverContext'
import { testUuid } from './testUuid'
import { graphql, GraphQLSchema } from 'graphql'
import { DiffResult } from '../../src/system-api/schema/types'
import { GQL } from './tags'
import Identity from '../../src/common/auth/Identity'
import ApiTester from './ApiTester'
import Client from '../../src/core/database/Client'
import { SystemContainer } from '../../src/system-api/SystemContainerFactory'
import SystemExecutionContainer from '../../src/system-api/SystemExecutionContainer'

export default class SystemApiTester {
	constructor(
		private readonly db: Client,
		private readonly systemSchema: GraphQLSchema,
		private readonly systemContainer: SystemContainer,
		private readonly systemExecutionContainer: SystemExecutionContainer
	) {}

	public async querySystem(
		gql: string,
		variables?: { [key: string]: any },
		options: {
			identity?: Identity
			roles?: string[]
			projectRoles?: string[]
		} = {}
	): Promise<any> {
		await setupSystemVariables(this.db, unnamedIdentity)
		const context: ResolverContext = new ResolverContext(
			options.identity ||
				new Identity.StaticIdentity(testUuid(888), options.roles || [Identity.SystemRole.SUPER_ADMIN], {
					[ApiTester.project.id]: options.projectRoles || [],
				}),
			{},
			this.systemContainer.authorizator,
			this.systemExecutionContainer,
			() => null
		)

		return await graphql(this.systemSchema, gql, null, context, variables)
	}

	public async diff(baseStage: string, headStage: string): Promise<DiffResult> {
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
			{ baseStage, headStage }
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
			}
		)
		if (!diff.data.diff.ok) {
			throw diff.data.diff.errors
		}

		await this.querySystem(
			GQL`mutation ($baseStage: String!, $headStage: String!, $events: [String!]!) {
        release(baseStage: $baseStage, headStage: $headStage, events: $events) {
          ok
        }
      }`,
			{
				baseStage,
				headStage,
				events: (diff.data.diff.result.events as any[])
					.slice(0, eventsCount || diff.data.diff.result.events.length)
					.map(it => it.id),
			}
		)
	}
}
