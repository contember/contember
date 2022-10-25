import { Actions, Model } from '@contember/schema'
import { TriggerListeners } from './TriggerListeners'
export interface IndirectListener {
	type: 'indirect'
	trigger: Actions.AnyTrigger
	rootEntity: Model.Entity
	fields: Set<string>
	relations: Set<string>
	path: string[]
}
export interface JunctionListener {
	type: 'junction'
	trigger: Actions.AnyTrigger
	rootEntity: Model.Entity
	path: string[]
	context: {
		entity: Model.Entity
		relation: Model.ManyHasManyOwningRelation | Model.ManyHasManyInverseRelation
		type: 'owning' | 'inverse'
	}
}
export interface DeleteListener {
	type: 'delete'
	trigger: Actions.AnyTrigger
	entity: Model.Entity
}
export interface CreateListener {
	type: 'create'
	trigger: Actions.AnyTrigger
	entity: Model.Entity
}
export interface UpdateListener {
	type: 'update'
	trigger: Actions.AnyTrigger
	entity: Model.Entity
	fields: Set<string>
}
export declare type AnyListener = JunctionListener | UpdateListener | CreateListener | DeleteListener | IndirectListener
export declare class TriggerListenersStore {
	private readonly listeners
	constructor(listeners: TriggerListeners)
	getUpdateListeners(entityName: string): UpdateListener[]
	getDeleteListener(entityName: string): DeleteListener[]
	getCreateListener(entityName: string): CreateListener[]
	getIndirectListeners(entityName: string): IndirectListener[]
	getJunctionListeners(entityName: string, relationName: string): JunctionListener[]
}
//# sourceMappingURL=TriggerListenersStore.d.ts.map
