import {
	AfterInsertEvent,
	AfterJunctionUpdateEvent,
	AfterUpdateEvent,
	BeforeDeleteEvent,
	BeforeUpdateEvent,
	EventManager,
} from '@contember/engine-content-api'
import { Input } from '@contember/schema'
import { IndirectListener, JunctionListener, TriggerListenersStore } from './TriggerListenersStore'
import { TriggerPayloadManager } from './TriggerPayloadManager'
import { TriggerIndirectChangesFetcher } from './TriggerIndirectChangesFetcher'

export type EventCause =
	| BeforeUpdateEvent
	| AfterUpdateEvent
	| BeforeDeleteEvent
	| AfterInsertEvent
	| AfterJunctionUpdateEvent

export class TriggerHandler {
	constructor(
		private readonly payloadManager: TriggerPayloadManager,
		private readonly listenersStore: TriggerListenersStore,
		private readonly changesFetcher: TriggerIndirectChangesFetcher,
	) {
	}

	attach(evm: EventManager) {
		evm.listen('BeforeDeleteEvent', async event => {
			await this.directDeleteHandler(event)
			await this.indirectChangesEntityHandler(event)
		})
		evm.listen('AfterInsertEvent', async event => {
			await this.indirectChangesEntityHandler(event)
			await this.directCreateHandler(event)
		})
		evm.listen('BeforeUpdateEvent', async event => {
			await this.indirectChangesRelationHandler(event)
		})
		evm.listen('AfterUpdateEvent', async event => {
			if (event.hasChanges) {
				await this.indirectChangesUpdatesHandler(event)
				await this.directUpdateHandler(event)
			}
		})
		evm.listen('AfterJunctionUpdateEvent', async event => {
			if (event.hasChanges) {
				await this.junctionHandler(event)
			}
		})
		evm.listen('BeforeCommitEvent', async event => {
			await this.payloadManager.persist()
		})
	}

	private async directDeleteHandler(event: BeforeDeleteEvent) {
		const deleteListeners = this.listenersStore.getDeleteListener(event.entity.name)
		if (!deleteListeners) {
			return
		}
		await Promise.all(deleteListeners.map(listener => {
			return this.payloadManager.add({
				listener,
				entity: event.entity,
				primary: event.id,
				cause: event,
			})
		}))
	}

	private async directUpdateHandler(event: AfterUpdateEvent) {
		const updateListeners = this.listenersStore.getUpdateListeners(event.entity.name)
		updateListeners.map(listener => {
			if (event.data.some(it => listener.fields.has(it.fieldName))) {
				this.payloadManager.add({
					listener,
					entity: event.entity,
					primary: event.id,
					cause: event,
				})
			}
		})
	}

	private async directCreateHandler(event: AfterInsertEvent) {
		const createListeners = this.listenersStore.getCreateListener(event.entity.name)
		createListeners.map(listener => {
			this.payloadManager.add({
				listener,
				entity: event.entity,
				primary: event.id,
				cause: event,
			})
		})
	}


	/**
	 * Collect affected triggers after entity was created or before it was deleted.
	 * todo: after insert, it should probably check only owning relations, because other relations are connected later, so it would be always empty
	 */
	private async indirectChangesEntityHandler(event: BeforeDeleteEvent | AfterInsertEvent) {
		//
		const indirectEntityListeners = this.listenersStore.getIndirectListeners(event.entity.name)
		const promises =  indirectEntityListeners.map(listener => this.collectDeepChanges(event, listener, {
			[event.entity.primary]: { eq: event.id },
		}))
		await Promise.all(promises)
	}

	private async indirectChangesRelationHandler(event: BeforeUpdateEvent) {
		await this.indirectChangesUpdatesHandlerInner(event, 'relations')
	}

	private async indirectChangesUpdatesHandler(event: AfterUpdateEvent) {
		await this.indirectChangesUpdatesHandlerInner(event, 'fields')
	}
	private async indirectChangesUpdatesHandlerInner(event: AfterUpdateEvent | BeforeUpdateEvent, type: 'fields' | 'relations') {
		const indirectEntityListeners = this.listenersStore.getIndirectListeners(event.entity.name)
		const promises = indirectEntityListeners.map(listener => {
			if (event.data.some(val => listener[type].has(val.fieldName))) {
				return this.collectDeepChanges(event, listener, {
					[event.entity.primary]: { eq: event.id },
				})
			}
		})
		await Promise.all(promises)
	}

	private async junctionHandler(event: AfterJunctionUpdateEvent) {
		const listeners = this.listenersStore.getJunctionListeners(event.owningEntity.name, event.owningRelation.name)
		const promises = listeners.map(listener => {
			const primary = listener.context.type === 'owning'
				? event.owningId
				: event.inverseId
			const entity = listener.context.entity
			return this.collectDeepChanges(event, listener, {
				[entity.primary]: { eq: primary },
			})
		})
		await Promise.all(promises)
	}


	private async collectDeepChanges(
		cause: EventCause,
		listener: IndirectListener | JunctionListener,
		where: Input.Where,
	) {
		const result = await this.changesFetcher.fetch(listener, where)
		for (const row of result) {
			this.payloadManager.add({
				listener,
				entity: listener.rootEntity,
				primary: row,
				cause,
			})
		}
	}
}
