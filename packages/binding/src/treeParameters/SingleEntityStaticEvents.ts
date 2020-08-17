import { EntityAccessor } from '../accessors'

export interface DesugaredSingleEntityStaticEvents {}

export interface SingleEntityStaticEvents {
	onInitialize: EntityAccessor.BatchUpdatesHandler | Set<EntityAccessor.BatchUpdatesHandler> | undefined
}

export interface SugarableSingleEntityStaticEvents {}

export interface UnsugarableSingleEntityStaticEvents {
	onInitialize?: EntityAccessor.BatchUpdatesHandler | Set<EntityAccessor.BatchUpdatesHandler>
}
