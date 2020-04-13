import { Stage } from '../dtos/Stage'
import { DiffQuery, StageBySlugQuery } from '../queries'
import DependencyBuilder from './DependencyBuilder'
import { EventsPermissionsVerifier } from './EventsPermissionsVerifier'
import EventApplier from './EventApplier'
import EventsRebaser from './EventsRebaser'
import UpdateStageEventCommand from '../commands/UpdateStageEventCommand'
import { createStageTree, StageTree } from '../stages/StageTree'
import { assertEveryIsContentEvent } from './eventUtils'
import { SchemaVersionBuilder } from '../../SchemaVersionBuilder'
import { DatabaseContext } from '../database/DatabaseContext'
import { ProjectConfig } from '../../types'

class ReleaseExecutor {
	constructor(
		private readonly dependencyBuilder: DependencyBuilder,
		private readonly permissionsVerifier: EventsPermissionsVerifier,
		private readonly eventApplier: EventApplier,
		private readonly eventsRebaser: EventsRebaser,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {}

	public async execute(
		db: DatabaseContext,
		project: ProjectConfig,
		permissionContext: EventsPermissionsVerifier.Context,
		targetStage: Stage,
		sourceStage: Stage,
		eventsToApply: string[],
	): Promise<void> {
		if (eventsToApply.length === 0) {
			return
		}
		const stageTree = createStageTree(project)
		const allEvents = await db.queryHandler.fetch(new DiffQuery(targetStage.event_id, sourceStage.event_id))
		assertEveryIsContentEvent(allEvents)
		const allEventsIds = new Set(allEvents.map(it => it.id))
		if (!this.allEventsExists(eventsToApply, allEventsIds)) {
			throw new Error() //todo
		}
		const schema = await this.schemaVersionBuilder.buildSchema(db)
		const dependencies = await this.dependencyBuilder.build(schema, allEvents)
		if (!this.verifyDependencies(eventsToApply, dependencies)) {
			throw new Error() //todo
		}

		const eventsSet = new Set(eventsToApply)
		const events = allEvents.filter(it => eventsSet.has(it.id))

		const permissions = this.permissionsVerifier.verify(
			db,
			project,
			permissionContext,
			sourceStage,
			targetStage,
			events,
		)
		if (Object.values(permissions).filter(it => !it).length) {
			throw new Error() // todo
		}

		await this.eventApplier.applyEvents(db, targetStage, events)
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
