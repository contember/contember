import { StageWithoutEvent } from '../dtos/Stage'
import StageCommonEventsMatrixQuery from '../queries/StageCommonEventsMatrixQuery'
import { DiffQuery } from '../queries/DiffQuery'
import { ContentEvent } from '@contember/engine-common'
import DependencyBuilder from './DependencyBuilder'
import EventApplier from './EventApplier'
import EventsRebaser from './EventsRebaser'
import StageTree from '../stages/StageTree'
import { ImplementationException } from '../../utils/exceptions'
import { assertEveryIsContentEvent } from './eventUtils'
import { SchemaVersionBuilder } from '../../SchemaVersionBuilder'
import { Schema } from '@contember/schema'
import { DatabaseContext } from '../database/DatabaseContext'

class RebaseExecutor {
	constructor(
		private readonly dependencyBuilder: DependencyBuilder,
		private readonly eventApplier: EventApplier,
		private readonly eventsRebaser: EventsRebaser,
		private readonly stageTree: StageTree,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {}

	public async rebaseAll(db: DatabaseContext) {
		const root = this.stageTree.getRoot()
		const commonEvents = await db.queryHandler.fetch(new StageCommonEventsMatrixQuery())
		for (const stage of this.stageTree.getChildren(root)) {
			await this.rebase(db, commonEvents, stage, root)
		}
	}

	private async rebase(
		db: DatabaseContext,
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
			await this.eventApplier.applyEvents(db, { ...stage, event_id: stageEventId }, [
				...prevEventsToApply,
				...eventsToApply,
			])

			newHead = await this.eventsRebaser.rebaseStageEvents(
				db,
				stage.slug,
				eventsInfo.stageBEventId,
				eventsInfo.commonEventId,
				newBase || eventsInfo.stageAEventId,
				[],
			)
		}

		for (const childStage of this.stageTree.getChildren(stage)) {
			await this.rebase(db, eventsInfoMatrix, childStage, stage, [...prevEventsToApply, ...eventsToApply], newHead)
		}
	}

	private async verifyCrossDependency(
		schema: Schema,
		eventsA: ContentEvent[],
		eventsB: ContentEvent[],
	): Promise<boolean> {
		const dependencies = await this.dependencyBuilder.build(schema, [...eventsA, ...eventsB])
		const ids = new Set(eventsA.map(it => it.id))

		return (
			eventsB
				.map(it => dependencies[it.id])
				.find(dependencies => dependencies.find(id => ids.has(id)) !== undefined) === undefined
		)
	}
}

export default RebaseExecutor
