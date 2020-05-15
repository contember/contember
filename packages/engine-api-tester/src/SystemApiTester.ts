import { createUuidGenerator, testUuid } from './testUuid'
import { graphql, GraphQLSchema } from 'graphql'
import { GQL } from './tags'
import {
	DatabaseContext,
	ProjectConfig,
	Identity,
	Schema,
	setupSystemVariables,
	StageBySlugQuery,
	SystemContainer,
	unnamedIdentity,
	ReleaseExecutor,
} from '@contember/engine-system-api'
import { project } from './project'
import { ProjectRole } from '@contember/schema'

export class SystemApiTester {
	private readonly uuidGenerator = createUuidGenerator('a454')

	constructor(
		private readonly db: DatabaseContext,
		private readonly project: ProjectConfig,
		private readonly releaseExecutor: ReleaseExecutor,
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

		const context = this.systemContainer.resolverContextFactory.create(this.db, this.project, identity, {})

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
			this.db.queryHandler.fetch(new StageBySlugQuery(baseStage)),
			this.db.queryHandler.fetch(new StageBySlugQuery(headStage)),
		])

		await this.releaseExecutor.execute(
			this.db,
			this.project,
			{
				identity: new Identity(testUuid(666), [ProjectRole.ADMIN]),
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
