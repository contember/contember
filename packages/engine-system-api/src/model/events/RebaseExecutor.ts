import { StageWithoutEvent } from '../dtos'
import { DiffQuery, StageCommonEventsMatrixQuery } from '../queries'
import { ContentEvent } from '@contember/engine-common'
import { DependencyBuilder } from './DependencyBuilder'
import { EventApplier } from './EventApplier'
import { EventsRebaser } from './EventsRebaser'
import { createStageTree, StageTree } from '../stages'
import { ImplementationException } from '../../utils'
import { assertEveryIsContentEvent } from './eventUtils'
import { Schema } from '@contember/schema'
import { DatabaseContext } from '../database'
import { ProjectConfig } from '../../types'
import { SchemaVersionBuilder } from '../migrations'

export class RebaseExecutor {
	constructor(
		private readonly dependencyBuilder: DependencyBuilder,
		private readonly eventApplier: EventApplier,
		private readonly eventsRebaser: EventsRebaser,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {}

	public async rebaseAll(db: DatabaseContext, project: ProjectConfig) {
		const stageTree = createStageTree(project)
		const root = stageTree.getRoot()
		const commonEvents = await db.queryHandler.fetch(new StageCommonEventsMatrixQuery())
		for (const stage of stageTree.getChildren(root)) {
			await this.rebase(db, stageTree, commonEvents, stage, root)
		}
	}

	private async rebase(
		db: DatabaseContext,
		stageTree: StageTree,
		eventsInfoMatrix: StageCommonEventsMatrixQuery.Result,
		stage: StageWithoutEvent,
		base: StageWithoutEvent,
		prevEventsToApply: ContentEvent[] = [],
		newBase?: string,
	) {
		const eventsInfo = eventsInfoMatrix[base.slug][stage.slug]
		let newHead: string = eventsInfo.stageBEventId
		let eventsToApply: ContentEvent[] = []
		const schema = await this.schemaVersionBuilder.buildSchema(db)
		if (prevEventsToApply.length > 0 || eventsInfo.distance > 0) {
			const tmpEventsToApply =
				eventsInfo.distance > 0
					? await db.queryHandler.fetch(new DiffQuery(eventsInfo.commonEventId, eventsInfo.stageAEventId))
					: []
			assertEveryIsContentEvent(tmpEventsToApply)
			eventsToApply = tmpEventsToApply

			const stageEvents =
				eventsInfoMatrix[stage.slug][base.slug].distance > 0
					? await db.queryHandler.fetch(new DiffQuery(eventsInfo.commonEventId, eventsInfo.stageBEventId))
					: []
			assertEveryIsContentEvent(stageEvents)

			if (eventsToApply.length === 0 && prevEventsToApply.length === 0) {
				throw new ImplementationException()
			}

			if (stageEvents.length > 0) {
				if (!this.verifyCrossDependency(schema, stageEvents, eventsToApply)) {
					throw new Error('Cannot rebase, unresolvable dependencies')
				}
			}

			const stageEventId = eventsInfoMatrix[stage.slug][stage.slug].stageAEventId
			await this.eventApplier.applyEvents(
				db,
				{ ...stage, event_id: stageEventId },
				[...prevEventsToApply, ...eventsToApply],
				schema,
			)

			newHead = await this.eventsRebaser.rebaseStageEvents(
				db,
				stage.slug,
				eventsInfo.stageBEventId,
				eventsInfo.commonEventId,
				newBase || eventsInfo.stageAEventId,
				[],
			)
		}

		for (const childStage of stageTree.getChildren(stage)) {
			await this.rebase(
				db,
				stageTree,
				eventsInfoMatrix,
				childStage,
				stage,
				[...prevEventsToApply, ...eventsToApply],
				newHead,
			)
		}
	}

	private async verifyCrossDependency(
		schema: Schema,
		eventsA: ContentEvent[],
		eventsB: ContentEvent[],
	): Promise<boolean> {
		const dependencies = await this.dependencyBuilder.build(schema, [...eventsA, ...eventsB])
		const ids = new Set(eventsA.map(it => it.id))
		for (const event of eventsB) {
			for (const dep of dependencies.get(event.id)?.values() || []) {
				if (ids.has(dep)) {
					return false
				}
			}
		}
		return true
	}
}
