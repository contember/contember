import { Connection } from './Connection'

export class EventManagerImpl {
	private readonly listeners = {
		[EventManager.Event.queryStart]: [] as EventManager.QueryStartCallback[],
		[EventManager.Event.queryEnd]: [] as EventManager.QueryEndCallback[],
		[EventManager.Event.queryError]: [] as EventManager.QueryStartCallback[],
	}

	constructor(private readonly parent: EventManager | null = null) {}

	on<Event extends keyof EventManager.ListenerTypes>(event: Event, cb: EventManager.ListenerTypes[Event]): void {
		(this.listeners[event] as EventManager.ListenerTypes[Event][]).push(cb)
	}

	fire<Event extends EventManager.Event>(event: Event, ...params: Parameters<EventManager.ListenerTypes[Event]>): void {
		(this.listeners[event] as EventManager.ListenerTypes[Event][]).forEach((cb: EventManager.ListenerTypes[Event]) =>
			cb(...(params as [any, any])),
		)
		if (this.parent) {
			this.parent.fire(event, ...params)
		}
	}

	removeListener<Event extends EventManager.Event>(
		event: EventManager.Event,
		cb: EventManager.ListenerTypes[Event],
	): void {
		this.listeners[event] = this.listeners[event].filter(it => it !== cb) as any[]
	}
}

type EventManager = { [P in keyof EventManagerImpl]: EventManagerImpl[P] }

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
