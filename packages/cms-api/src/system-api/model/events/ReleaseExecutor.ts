import { Stage } from '../dtos/Stage'
import DiffQuery from '../queries/DiffQuery'
import QueryHandler from '../../../core/query/QueryHandler'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import DependencyBuilder from './DependencyBuilder'
import PermissionsVerifier from './PermissionsVerifier'
import EventApplier from './EventApplier'
import EventsRebaser from './EventsRebaser'
import StageByIdQuery from '../queries/StageByIdQuery'

class ReleaseExecutor {
	constructor(
		private readonly queryHandler: QueryHandler<KnexQueryable>,
		private readonly dependencyBuilder: DependencyBuilder,
		private readonly permissionsVerifier: PermissionsVerifier,
		private readonly eventApplier: EventApplier,
		private readonly eventsRebaser: EventsRebaser
	) {}

	public async execute(
		permissionContext: PermissionsVerifier.Context,
		baseStage: Stage,
		headStage: Stage,
		eventsToApply: string[]
	): Promise<void> {
		const allEvents = await this.queryHandler.fetch(new DiffQuery(baseStage.event_id, headStage.event_id))
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

		const permissions = this.permissionsVerifier.verify(permissionContext, headStage, baseStage, events)
		if (Object.values(permissions).filter(it => !it).length) {
			throw new Error() // todo
		}

		await this.eventApplier.applyEvents(baseStage, events)
		const newBase = await this.queryHandler.fetch(new StageByIdQuery(baseStage.id))
		if (!newBase) {
			throw new Error('should not happen')
		}
		await this.eventsRebaser.rebaseStage(headStage, baseStage, newBase, eventsToApply)
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
