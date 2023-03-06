export type EventMap = {
	[name: string]: (arg: any) => any
}

export type EventUnlisten = () => void

export interface EventEmitter<E extends EventMap> {
	on<K extends keyof E>(event: K, cb: E[K]): EventUnlisten
}

export class EventManager<E extends EventMap> implements EventEmitter<E> {
	private listeners: {
		[K in keyof E]?: E[K][]
	} = {}

	public on<K extends keyof E>(event: K, cb: E[K]): EventUnlisten {
		(this.listeners[event] ??= []).push(cb)
		return () => {
			return this.listeners[event] = this.listeners[event]?.filter(it => it !== cb)
		}
	}

	public fire<K extends keyof E>(event: K, args: Parameters<E[K]>[0]): ReturnType<E[K]>[] {
		const result: ReturnType<E[K]>[] = []
		for (const cb of this.listeners[event] ?? []) {
			result.push(cb(args))
		}
		return result
	}
}
