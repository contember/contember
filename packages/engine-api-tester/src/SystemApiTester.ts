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
	InitEventQuery,
	DiffQuery,
	EventApplier,
	UpdateStageEventCommand,
} from '@contember/engine-system-api'
import { ProjectRole } from '@contember/schema'
import { AnyEvent } from '@contember/engine-common'

export class SystemApiTester {
	private readonly uuidGenerator = createUuidGenerator('a454')

	constructor(
		private readonly db: DatabaseContext,
		private readonly project: ProjectConfig,
		private readonly eventApplier: EventApplier,
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

		return result
	}

	public async diff(stage: string): Promise<Schema.DiffResult> {
		const result = await this.querySystem(
			GQL`query($stage: String!) {
        diff(stage: $stage) {
          ok
          errors
          result {
            events {
              id
              dependencies
              description
              type
            }
          }
        }
      }`,
			{ stage: stage },
		)

		if (!result.data.diff.ok) {
			throw result.data.diff.errors
		}

		return result.data.diff.result
	}

	public async releaseForward(headStage: string, baseStage: string, eventsCount?: number): Promise<void> {
		const baseEvents = await this.fetchEvents(baseStage)
		const headEvents = await this.fetchEvents(headStage)
		if (!baseEvents.every((it, i) => headEvents[i] && it.id === headEvents[i].id)) {
			throw new Error('cannot release forward')
		}
		const events = headEvents.slice(baseEvents.length, eventsCount ? baseEvents.length + eventsCount : undefined)
		const baseStageObj = await this.db.queryHandler.fetch(new StageBySlugQuery(baseStage))
		if (!baseStageObj) {
			throw new Error()
		}
		const schema = await this.systemContainer.schemaVersionBuilder.buildSchema(this.db)
		await this.eventApplier.applyEvents(this.db, baseStageObj, events, schema)
		await this.db.commandBus.execute(new UpdateStageEventCommand(baseStage, events[events.length - 1].id))
	}

	public async fetchEvents(stage: string): Promise<AnyEvent[]> {
		const initEvent = await this.db.queryHandler.fetch(new InitEventQuery())
		const stageHead = (await this.db.queryHandler.fetch(new StageBySlugQuery(stage)))!.event_id

		return await this.db.queryHandler.fetch(new DiffQuery(initEvent.id, stageHead))
	}
}
