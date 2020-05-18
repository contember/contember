import { Stage } from '../dtos'
import { DiffQuery, StageBySlugQuery } from '../queries'
import { DependencyBuilder, EventsDependencies } from './DependencyBuilder'
import { EventsRebaser } from './EventsRebaser'
import { UpdateStageEventCommand } from '../commands'
import { createStageTree, StageTree } from '../stages'
import { assertEveryIsContentEvent } from './eventUtils'
import { DatabaseContext } from '../database'
import { ProjectConfig } from '../../types'
import { SchemaVersionBuilder } from '../migrations'
import { ContentEventsApplier } from '../dependencies'
import { formatSchemaName } from '../helpers'
import { Identity } from '../authorization'
import { Acl } from '@contember/schema'

export class ReleaseExecutor {
	constructor(
		private readonly dependencyBuilder: DependencyBuilder,
		private readonly eventApplier: ContentEventsApplier,
		private readonly eventsRebaser: EventsRebaser,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {}

	public async execute(
		db: DatabaseContext,
		project: ProjectConfig,
		permissionContext: {
			variables: Acl.VariablesMap
			identity: Identity
		},
		targetStage: Stage,
		sourceStage: Stage,
		eventsToApply: string[],
	): Promise<ReleaseExecutorResult> {
		if (eventsToApply.length === 0) {
			return new ReleaseExecutorOkResult()
		}
		const stageTree = createStageTree(project)
		const allEvents = await db.queryHandler.fetch(new DiffQuery(targetStage.event_id, sourceStage.event_id))
		assertEveryIsContentEvent(allEvents)
		const allEventsIds = new Set(allEvents.map(it => it.id))

		const nonExistingEvents = this.getNonExistingEvents(eventsToApply, allEventsIds)
		if (nonExistingEvents.length !== 0) {
			throw new Error(`Following events were not found: ${nonExistingEvents.join(', ')}`)
		}
		const schema = await this.schemaVersionBuilder.buildSchema(db)
		const dependencies = await this.dependencyBuilder.build(schema, allEvents)
		if (!this.verifyDependencies(eventsToApply, dependencies)) {
			throw new Error(`Some dependencies are missing`)
		}

		const eventsSet = new Set(eventsToApply)
		const events = allEvents.filter(it => eventsSet.has(it.id))

		const result = await this.eventApplier.apply(
			{
				db: db.client.forSchema(formatSchemaName(targetStage)),
				schema,
				identityVariables: permissionContext.variables,
				roles: permissionContext.identity.roles,
			},
			events,
		)
		if (!result.ok) {
			return new ReleaseExecutorErrorResult([ReleaseExecutorErrorCode.forbidden])
		}

		const newBase = await db.queryHandler.fetch(new StageBySlugQuery(targetStage.slug))
		if (!newBase) {
			throw new Error('should not happen')
		}
		if (
			this.isFastForward(
				eventsToApply,
				allEvents.map(it => it.id),
			)
		) {
			await db.commandBus.execute(
				new UpdateStageEventCommand(targetStage.slug, eventsToApply[eventsToApply.length - 1]),
			)
		} else {
			await this.rebaseRecursive(db, stageTree, sourceStage, targetStage.event_id, newBase.event_id, eventsToApply)
		}
		return new ReleaseExecutorOkResult()
	}

	private async rebaseRecursive(
		db: DatabaseContext,
		stageTree: StageTree,
		rebasedStage: Stage,
		oldBase: string,
		newBase: string,
		droppedEvents: string[],
	) {
		const newHead = await this.eventsRebaser.rebaseStageEvents(
			db,
			rebasedStage.slug,
			rebasedStage.event_id,
			oldBase,
			newBase,
			droppedEvents,
		)
		for (const child of stageTree.getChildren(rebasedStage)) {
			const childWithEvent = await db.queryHandler.fetch(new StageBySlugQuery(child.slug))
			await this.rebaseRecursive(db, stageTree, childWithEvent!, rebasedStage.event_id, newHead, [])
		}
	}

	private isFastForward(eventsToApply: string[], allEvents: string[]) {
		for (let i in eventsToApply) {
			if (eventsToApply[i] !== allEvents[i]) {
				return false
			}
		}
		return true
	}

	private getNonExistingEvents(eventsToApply: string[], existingEvents: Set<string>): string[] {
		return eventsToApply.filter(id => !existingEvents.has(id))
	}

	private verifyDependencies(eventsToApply: string[], dependencies: EventsDependencies): boolean {
		const checked = new Set<string>()
		const eventsSet = new Set(eventsToApply)
		const verify = (id: string): boolean => {
			if (!dependencies[id]) {
				throw new Error()
			}
			checked.add(id)
			for (let dependency of dependencies[id]) {
				if (checked.has(dependency)) {
					continue
				}
				if (!eventsSet.has(dependency) || !verify(dependency)) {
					return false
				}
			}
			return true
		}
		for (let id of eventsToApply) {
			if (!verify(id)) {
				return false
			}
		}
		return true
	}
}

export class ReleaseExecutorOkResult {
	public readonly ok = true
}

export enum ReleaseExecutorErrorCode {
	forbidden = 'forbidden',
}

export class ReleaseExecutorErrorResult {
	public readonly ok = false
	constructor(public readonly errors: ReleaseExecutorErrorCode[]) {}
}

export type ReleaseExecutorResult = ReleaseExecutorOkResult | ReleaseExecutorErrorResult
