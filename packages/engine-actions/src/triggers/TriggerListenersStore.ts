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

export type AnyListener =
	| JunctionListener
	| UpdateListener
	| CreateListener
	| DeleteListener
	| IndirectListener

export class TriggerListenersStore {
	constructor(
		private readonly listeners: TriggerListeners,
	) {
	}

	public getUpdateListeners(entityName: string): UpdateListener[] {
		return this.listeners.updateListeners.get(entityName) ?? []
	}

	public getDeleteListener(entityName: string): DeleteListener[] {
		return this.listeners.deleteListeners.get(entityName) ?? []
	}

	public getCreateListener(entityName: string): CreateListener[] {
		return this.listeners.createListeners.get(entityName) ?? []
	}

	public getIndirectListeners(entityName: string): IndirectListener[] {
		return this.listeners.indirectListeners.get(entityName) ?? []
	}

	public getJunctionListeners(entityName: string, relationName: string): JunctionListener[] {
		return this.listeners.junctionListeners.get(entityName)?.get(relationName) ?? []
	}
}
