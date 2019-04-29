import { Stage } from '../dtos/Stage'
import DiffQuery from '../queries/DiffQuery'
import QueryHandler from '../../../core/query/QueryHandler'
import DbQueryable from '../../../core/database/DbQueryable'
import DependencyBuilder from './DependencyBuilder'
import PermissionsVerifier from './PermissionsVerifier'
import EventApplier from './EventApplier'
import EventsRebaser from './EventsRebaser'
import StageByIdQuery from '../queries/StageByIdQuery'
import UpdateStageEventCommand from '../commands/UpdateStageEventCommand'
import Client from '../../../core/database/Client'

class ReleaseExecutor {
	constructor(
		private readonly queryHandler: QueryHandler<DbQueryable>,
		private readonly dependencyBuilder: DependencyBuilder,
		private readonly permissionsVerifier: PermissionsVerifier,
		private readonly eventApplier: EventApplier,
		private readonly eventsRebaser: EventsRebaser,
		private readonly db: Client
	) {}

	public async execute(
		permissionContext: PermissionsVerifier.Context,
		targetStage: Stage,
		sourceStage: Stage,
		eventsToApply: string[]
	): Promise<void> {
		if (eventsToApply.length === 0) {
			return
		}
		const allEvents = await this.queryHandler.fetch(new DiffQuery(targetStage.event_id, sourceStage.event_id))
		const allEventsIds = new Set(allEvents.map(it => it.id))
		if (!this.allEventsExists(eventsToApply, allEventsIds)) {
			throw new Error() //todo
		}
		const dependencies = await this.dependencyBuilder.build(allEvents)
		if (!this.verifyDependencies(eventsToApply, dependencies)) {
			throw new Error() //todo
		}

		const eventsSet = new Set(eventsToApply)
		const events = allEvents.filter(it => eventsSet.has(it.id))

		const permissions = this.permissionsVerifier.verify(permissionContext, sourceStage, targetStage, events)
		if (Object.values(permissions).filter(it => !it).length) {
			throw new Error() // todo
		}

		await this.eventApplier.applyEvents(targetStage, events)
		const newBase = await this.queryHandler.fetch(new StageByIdQuery(targetStage.id))
		if (!newBase) {
			throw new Error('should not happen')
		}
		if (this.isFastForward(eventsToApply, allEvents.map(it => it.id))) {
			await new UpdateStageEventCommand(targetStage.id, eventsToApply[eventsToApply.length - 1]).execute(this.db)
		} else {
			await this.eventsRebaser.rebaseStageEvents(
				sourceStage.id,
				sourceStage.event_id,
				targetStage.event_id,
				newBase.event_id,
				eventsToApply
			)
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

	private allEventsExists(eventsToApply: string[], existingEvents: Set<string>): boolean {
		for (const event of eventsToApply) {
			if (!existingEvents.has(event)) {
				return false
			}
		}
		return true
	}

	private verifyDependencies(eventsToApply: string[], dependencies: DependencyBuilder.Dependencies): boolean {
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

export default ReleaseExecutor
