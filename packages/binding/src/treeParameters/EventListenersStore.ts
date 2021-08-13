type GenericEventsMap<EventTypes extends string> = {
	[K in EventTypes]?: (...args: any[]) => void | Promise<void | any>
}

export class EventListenersStore<EventTypes extends string, Events extends GenericEventsMap<EventTypes>> {

	constructor(
		private readonly parentStoreGetter?: () => EventListenersStore<EventTypes, Events> | undefined,
		private listeners: Map<string, Set<Events[any]>> = new Map(),
	) {}

	set<Type extends EventTypes>(event: { type: Type; key?: string }, listeners: Set<Events[Type]>): void {
		this.listeners.set(this.formatMapEntryKey(event), listeners)
	}

	delete<Type extends EventTypes>(event: { type: Type; key?: string }) {
		this.listeners.delete(this.formatMapEntryKey(event))
	}

	deleteByType<Type extends EventTypes>(type: Type) {
		const prefix = this.formatMapEntryKey({ type, key: '' })
		for (const eventType of this.listeners.keys()) {
			if (eventType.startsWith(prefix)) {
				this.listeners.delete(eventType)
			}
		}
	}

	get<Type extends EventTypes>(event: { type: Type; key?: string }): Set<Events[Type]> | undefined {
		const ownListeners = this.listeners.get(this.formatMapEntryKey(event))
		const parentListeners = this.parentStoreGetter?.()?.get(event)
		if (!parentListeners) {
			return ownListeners
		} else if (!ownListeners) {
			return parentListeners
		}
		return new Set([...ownListeners, ...parentListeners])
	}

	add<Type extends EventTypes>(event: { type: Type; key?: string }, handler: Events[Type]): () => void {
		const key = this.formatMapEntryKey(event)
		let eventListeners = this.addInternal(key, handler)
		return () => eventListeners?.delete(handler)
	}

	cloneDeep(): EventListenersStore<EventTypes, Events> {
		const store: EventListenersStore<EventTypes, Events> = new EventListenersStore()
		for (const [key, value] of this.listeners.entries()) {
			store.listeners.set(key, new Set(value))
		}
		return store
	}

	clone(): EventListenersStore<EventTypes, Events> {
		const store: EventListenersStore<EventTypes, Events> = new EventListenersStore()
		store.listeners = new Map(this.listeners)
		return store
	}

	append(other: EventListenersStore<EventTypes, Events>) {
		for (const [eventKey, otherListeners] of other.listeners) {
			for (const listener of otherListeners) {
				this.addInternal(eventKey, listener)
			}
		}
	}

	private formatMapEntryKey(event: { type: string; key?: string }): string {
		return event.key ? `${event.type}_${event.key ?? ''}` : event.type
	}

	private addInternal<Type extends keyof Events>(key: string, handler: Events[Type]) {
		let eventListeners = this.listeners.get(key)
		if (!eventListeners) {
			eventListeners = new Set()
			this.listeners.set(key, eventListeners)
		}
		eventListeners.add(handler)
		return eventListeners
	}
}
