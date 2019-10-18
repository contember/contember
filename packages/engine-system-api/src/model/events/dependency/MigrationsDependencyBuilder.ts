import { AnyEvent, EventType } from '@contember/engine-common'
import DependencyBuilder from '../DependencyBuilder'

/**
 * Every migration event depends on every previous event until previous migration event
 * Also, every event depends on previous migration
 *
 *        v--v--v--\
 *  v--v-\         |
 * E1 E2 M1 E3 E4 M2 E5
 *        ^-/  |     |
 *        ^---/      |
 *                 ^-/
 *
 */
class MigrationsDependencyBuilder implements DependencyBuilder {
	async build(events: AnyEvent[]): Promise<DependencyBuilder.Dependencies> {
		let processedEvents: string[] = []
		const processedMigrations: string[] = []
		const dependencies: DependencyBuilder.Dependencies = {}
		for (const event of events) {
			if (event.type === EventType.runMigration) {
				processedMigrations.push(event.id)
				dependencies[event.id] = [...processedEvents]
				processedEvents = []
			} else {
				dependencies[event.id] =
					processedMigrations.length > 0 ? [processedMigrations[processedMigrations.length - 1]] : []
			}
			processedEvents.push(event.id)
		}
		return dependencies
	}
}

export default MigrationsDependencyBuilder
