import { Actions, Model } from '@contember/schema'
import { TriggerListeners } from './TriggerListeners'
import { JunctionListener, TriggerListenersStore } from './TriggerListenersStore'
import { acceptFieldVisitor, getEntity } from '@contember/schema-utils'
import { mapGetOrPut } from '../utils/map'
import { ImplementationException } from '../ImplementationException'

export class TriggerListenerBuilder {

	private readonly data: TriggerListeners = {
		createListeners: new Map(),
		updateListeners: new Map(),
		deleteListeners: new Map(),
		indirectListeners: new Map(),
		junctionListeners: new Map(),
	}

	constructor(
		private readonly model: Model.Schema,
	) {
	}

	public add(trigger: Actions.AnyTrigger) {
		if (trigger.type === 'basic') {
			this.processBasicTrigger(trigger)
		} else if (trigger.type === 'watch') {
			this.processIndirectListeners(trigger)
		} else {
			((_: never) => {
				throw new ImplementationException(`Unhandled trigger ${(trigger as any).type}`)
			})(trigger)
		}
	}

	private processBasicTrigger(trigger: Actions.BasicTrigger) {
		const entity = getEntity(this.model, trigger.entity)
		if (trigger.create) {
			this.addListener('createListeners', trigger.entity, {
				type: 'create',
				entity,
				trigger,
			})
		}
		if (trigger.delete) {
			this.addListener('deleteListeners', trigger.entity, {
				type: 'delete',
				entity,
				trigger,
			})
		}
		if (trigger.update) {
			this.addListener('updateListeners', trigger.entity, {
				type: 'update',
				entity,
				trigger,
				fields: new Set(Object.keys(entity.fields)), // todo: only columns and owning
			})
		}
	}

	private processIndirectListeners(
		trigger: Actions.WatchTrigger,
	) {
		const entity = getEntity(this.model, trigger.entity)
		this.addListener('createListeners', trigger.entity, {
			type: 'create',
			entity,
			trigger,
		})
		this.addListener('deleteListeners', trigger.entity, {
			type: 'delete',
			entity,
			trigger,
		})
		this.processIndirectListenersNode(trigger, entity, entity, trigger.watch, [])
	}
	private processIndirectListenersNode(
		trigger: Actions.WatchTrigger,
		rootEntity: Model.Entity,
		entity: Model.Entity,
		node: Actions.SelectionNode,
		path: string[],
	) {
		const fields = new Set<string>()
		const relations = new Set<string>()
		for (const entry of node) {
			const [field, args, selection] = Array.isArray(entry) ? entry : [entry, undefined, undefined]
			acceptFieldVisitor(this.model, entity, field, {
				visitColumn: ({ entity, column }) => {
					if (selection?.length > 0) {
						throw new ImplementationException(`Column ${field} cannot have sub-selection`)
					}
					fields.add(column.name)
				},
				visitManyHasOne: ({ entity, relation, targetEntity, targetRelation }) => {
					fields.add(relation.name)
					relations.add(relation.name)
					if (selection?.length > 0) {
						this.processIndirectListenersNode(trigger, rootEntity, targetEntity, selection, [...path, relation.name])
					}
				},
				visitOneHasMany: ({ entity, relation, targetEntity, targetRelation }) => {
					this.processIndirectListenersNode(trigger, rootEntity, targetEntity, [...selection ?? [], targetRelation.name], [...path, relation.name])
				},
				visitOneHasOneOwning: ({ entity, relation, targetEntity, targetRelation }) => {
					fields.add(relation.name)
					relations.add(relation.name)
					if (selection?.length > 0) {
						this.processIndirectListenersNode(trigger, rootEntity, targetEntity, selection, [...path, relation.name])
					}
				},
				visitOneHasOneInverse: ({ entity, relation, targetEntity, targetRelation }) => {
					this.processIndirectListenersNode(trigger, rootEntity, targetEntity, [...selection ?? [], targetRelation.name], [...path, relation.name])
				},
				visitManyHasManyOwning: ({ entity, relation, targetEntity, targetRelation }) => {
					this.addJunctionListener(entity.name, relation.name, {
						type: 'junction',
						rootEntity,
						path: path,
						trigger,
						context: {
							entity,
							relation,
							type: 'owning',
						},
					})
					if (selection?.length > 0) {
						this.processIndirectListenersNode(trigger, rootEntity, targetEntity, selection, [...path, relation.name])
					}
				},
				visitManyHasManyInverse: ({ entity, relation, targetEntity, targetRelation }) => {
					this.addJunctionListener(targetEntity.name, targetRelation.name, {
						type: 'junction',
						rootEntity,
						path: path,
						trigger,
						context: {
							entity,
							relation,
							type: 'inverse',
						},
					})
					if (selection?.length > 0) {
						this.processIndirectListenersNode(trigger, rootEntity, targetEntity, selection, [...path, relation.name])
					}
				},
			})
		}
		if (path.length === 0) {
			this.addListener('updateListeners', entity.name, {
				type: 'update',
				entity: rootEntity,
				fields,
				trigger,
			})
		} else {
			this.addListener('indirectListeners', entity.name, {
				type: 'indirect',
				rootEntity: rootEntity,
				fields,
				relations,
				path,
				trigger,
			})
		}
	}

	public createStore(): TriggerListenersStore {
		return new TriggerListenersStore(this.data)
	}


	private addListener<
		K extends Exclude<keyof TriggerListeners, 'junctionListeners'>,
		V extends TriggerListeners[K] extends Map<string, infer V extends any[]> ? V[number] : never
	>
	(
		type: K,
		entityName: string,
		value: V,
	) {
		mapGetOrPut<string, V[], []>(this.data[type] as Map<string, V[]>, entityName, () => []).push(value)
	}

	private addJunctionListener(entityName: string, relationName: string, listener: JunctionListener) {
		const entityJunctionListeners = mapGetOrPut(this.data.junctionListeners, entityName, () => new Map())
		const relationListeners = mapGetOrPut(entityJunctionListeners, relationName, () => [])
		relationListeners.push(listener)
	}
}
