import { Connection } from './Connection'

class EventManager {
	private readonly listeners: EventManager.ListenersList = {
		[EventManager.Event.queryStart]: [],
		[EventManager.Event.queryEnd]: [],
		[EventManager.Event.queryError]: [],
	}

	constructor(private readonly parent: EventManager | null = null) {}

	on(event: EventManager.Event.queryStart, cb: EventManager.QueryStartCallback): void
	on(event: EventManager.Event.queryEnd, cb: EventManager.QueryEndCallback): void
	on(event: EventManager.Event.queryError, cb: EventManager.QueryErrorCallback): void
	on<Event extends EventManager.Event>(event: Event, cb: EventManager.ListenerTypes[Event]): void {
		this.listeners[event].push(cb as any)
	}

	fire(event: EventManager.Event.queryStart, ...params: Parameters<EventManager.QueryStartCallback>): void
	fire(event: EventManager.Event.queryEnd, ...params: Parameters<EventManager.QueryEndCallback>): void
	fire(event: EventManager.Event.queryError, ...params: Parameters<EventManager.QueryErrorCallback>): void
	fire<Event extends EventManager.Event>(event: Event, ...params: Parameters<EventManager.ListenerTypes[Event]>): void {
		this.listeners[event].forEach((cb: any) => cb(...(params as any)))
		if (this.parent) {
			this.parent.fire(event as any, ...(params as [any, any]))
		}
	}
}

namespace EventManager {
	export enum Event {
		queryStart = 'queryStart',
		queryEnd = 'queryEnd',
		queryError = 'queryError',
	}

	export type QueryStartCallback = (query: Connection.Query) => void
	export type QueryEndCallback = (query: Connection.Query, result: Connection.Result) => void
	export type QueryErrorCallback = (query: Connection.Query, error: Error) => void

	export interface ListenerTypes {
		[EventManager.Event.queryStart]: QueryStartCallback
		[EventManager.Event.queryEnd]: QueryEndCallback
		[EventManager.Event.queryError]: QueryErrorCallback
	}

	export type ListenersList = { [T in keyof ListenerTypes]: ListenerTypes[T][] }
}

export { EventManager }
