import { EntityListAccessor } from '../accessors'

export interface DesugaredEntityListStaticEvents {}

export interface EntityListStaticEvents {
	onInitialize: EntityListAccessor.BatchUpdatesHandler | Set<EntityListAccessor.BatchUpdatesHandler> | undefined
}

export interface SugarableEntityListStaticEvents {}

export interface UnsugarableEntityListStaticEvents {
	onInitialize?: EntityListAccessor.BatchUpdatesHandler | Set<EntityListAccessor.BatchUpdatesHandler>
}
