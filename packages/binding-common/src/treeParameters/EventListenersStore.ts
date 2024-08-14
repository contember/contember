type AnyFunction = (...args: any[]) => any
export type GenericEventsMap = {
	[K in string]: (...args: any[]) => void | AnyFunction | Promise<void | AnyFunction>
}

export class EventListenersStore<Events extends GenericEventsMap> {

	constructor(
		private readonly parentStoreGetter?: () => EventListenersStore<Events> | undefined,
		private listeners: Map<string, Set<Events[any]>> = new Map(),
	) {}

	set<Type extends keyof Events>(event: { type: Type; key?: string }, listeners: Set<Events[Type]>): void {
		this.listeners.set(this.formatMapEntryKey(event), listeners)
	}

	delete<Type extends keyof Events>(event: { type: Type; key?: string }) {
		this.listeners.delete(this.formatMapEntryKey(event))
	}

	deleteByType<Type extends keyof Events>(type: Type) {
		const prefix = this.formatMapEntryKey({ type, key: '' })
		for (const eventType of this.listeners.keys()) {
			if (eventType.startsWith(prefix)) {
				this.listeners.delete(eventType)
			}
		}
	}

	get<Type extends keyof Events>(event: { type: Type; key?: string }): Set<Events[Type]> | undefined {
		const ownListeners = this.listeners.get(this.formatMapEntryKey(event))
		const parentListeners = this.parentStoreGetter?.()?.get(event)
		if (!parentListeners) {
			return ownListeners
		} else if (!ownListeners) {
			return parentListeners
		}
		return new Set([...ownListeners, ...parentListeners])
	}

	invoke<Type extends keyof Events>(event: { type: Type; key?: string }, ...args: Parameters<Events[Type]>): void {
		const listeners = this.get(event)
		if (listeners) {
			for (const listener of listeners) {
				listener(...args)
			}
		}
	}

	add<Type extends keyof Events>(event: { type: Type; key?: string }, handler: Events[Type]): () => void {
		const key = this.formatMapEntryKey(event)
		let eventListeners = this.addInternal(key, handler)
		return () => eventListeners?.delete(handler)
	}

	clone(): EventListenersStore<Events> {
		const store: EventListenersStore<Events> = new EventListenersStore()
		for (const [key, value] of this.listeners.entries()) {
			store.listeners.set(key, new Set(value))
		}
		return store
	}

	append(other: EventListenersStore<Events>) {
		for (const [eventKey, otherListeners] of other.listeners) {
			for (const listener of otherListeners) {
				this.addInternal(eventKey, listener)
			}
		}
	}

	private formatMapEntryKey(event: { type: keyof Events; key?: string }): string {
		return event.key ? `${(event.type as string)}_${event.key ?? ''}` : (event.type as string)
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
