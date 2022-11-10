import { TriggerListenersFactory, TriggerListenersStore } from './triggers'
import { Schema } from '@contember/schema'

export class ListenerStoreProvider {
	private listenersStoreCache = new WeakMap<Schema, TriggerListenersStore>()

	public getListenerStore(schema: Schema): TriggerListenersStore {
		const currentStore = this.listenersStoreCache.get(schema)
		if (currentStore) {
			return currentStore
		}
		const listenersFactory = new TriggerListenersFactory(schema)
		const newStore = listenersFactory.create()
		this.listenersStoreCache.set(schema, newStore)
		return newStore
	}
}
