import { StageWithoutEvent } from '../dtos/Stage'
import QueryHandler from '../../../core/query/QueryHandler'
import DbQueryable from '../../../core/knex/DbQueryable'
import StageCommonEventsMatrixQuery from '../queries/StageCommonEventsMatrixQuery'
import DiffQuery from '../queries/DiffQuery'
import { AnyEvent } from '../dtos/Event'
import DependencyBuilder from './DependencyBuilder'
import EventApplier from './EventApplier'
import EventsRebaser from './EventsRebaser'
import StageTree from '../stages/StageTree'
import ImplementationException from '../../../core/exceptions/ImplementationException'

class RebaseExecutor {
	constructor(
		private readonly queryHandler: QueryHandler<DbQueryable>,
		private readonly dependencyBuilder: DependencyBuilder,
		private readonly eventApplier: EventApplier,
		private readonly eventsRebaser: EventsRebaser,
		private readonly stageTree: StageTree
	) {}

	public async rebaseAll() {
		const root = this.stageTree.getRoot()
		const commonEvents = await this.queryHandler.fetch(new StageCommonEventsMatrixQuery())
		for (const stage of this.stageTree.getChildren(root)) {
			await this.rebase(commonEvents, stage, root)
		}
	}

	private async rebase(
		eventsInfoMatrix: StageCommonEventsMatrixQuery.Result,
		stage: StageWithoutEvent,
		base: StageWithoutEvent,
		prevEventsToApply: AnyEvent[] = [],
		newBase?: string
	) {
		const eventsInfo = eventsInfoMatrix[base.id][stage.id]
		let newHead: string = eventsInfo.stageBEventId
		let eventsToApply: AnyEvent[] = []
		if (prevEventsToApply.length > 0 || eventsInfo.distance > 0) {
			eventsToApply =
				eventsInfo.distance > 0
					? await this.queryHandler.fetch(new DiffQuery(eventsInfo.commonEventId, eventsInfo.stageAEventId))
					: []

			const stageEvents =
				eventsInfoMatrix[stage.id][base.id].distance > 0
					? await this.queryHandler.fetch(new DiffQuery(eventsInfo.commonEventId, eventsInfo.stageBEventId))
					: []

			if (eventsToApply.length === 0 && prevEventsToApply.length === 0) {
				throw new ImplementationException()
			}

			if (stageEvents.length > 0) {
				if (!this.verifyCrossDependency(stageEvents, eventsToApply)) {
					throw new Error('Cannot rebase, unresolvable dependencies')
				}
			}

			const stageEventId = eventsInfoMatrix[stage.id][stage.id].stageAEventId
			await this.eventApplier.applyEvents({ ...stage, event_id: stageEventId }, [
				...prevEventsToApply,
				...eventsToApply,
			])

			newHead = await this.eventsRebaser.rebaseStageEvents(
				stage.id,
				eventsInfo.stageBEventId,
				eventsInfo.commonEventId,
				newBase || eventsInfo.stageAEventId,
				[]
			)
		}

		for (const childStage of this.stageTree.getChildren(stage)) {
			await this.rebase(eventsInfoMatrix, childStage, stage, [...prevEventsToApply, ...eventsToApply], newHead)
		}
	}

	private async verifyCrossDependency(eventsA: AnyEvent[], eventsB: AnyEvent[]): Promise<boolean> {
		const dependencies = await this.dependencyBuilder.build([...eventsA, ...eventsB])
		const ids = new Set(eventsA.map(it => it.id))

		return (
			eventsB
				.map(it => dependencies[it.id])
				.find(dependencies => dependencies.find(id => ids.has(id)) !== undefined) === undefined
		)
	}
}

export default RebaseExecutor
