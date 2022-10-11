import { Input, Model, Value } from '@contember/schema'
import { ResolvedColumnValue } from './ColumnValue'
import { Mapper } from './Mapper'
import { logger } from '@contember/logger'

export class BeforeInsertEvent {
	public type = 'BeforeInsertEvent' as const

	public afterEvent: AfterInsertEvent | undefined = undefined

	constructor(
		public readonly entity: Model.Entity,
		public readonly data: ResolvedColumnValue[],
	) {
	}
}

export class AfterInsertEvent {
	public type = 'AfterInsertEvent' as const

	constructor(
		public readonly entity: Model.Entity,
		public readonly data: ResolvedColumnValue[],
		public readonly id: Input.PrimaryValue,
	) {
	}
}


export class BeforeUpdateEvent {
	public type = 'BeforeUpdateEvent' as const

	public afterEvent: AfterUpdateEvent | undefined = undefined

	constructor(
		public readonly entity: Model.Entity,
		public readonly data: ResolvedColumnValue[],
		public readonly id: Input.PrimaryValue,
	) {
	}
}

export class AfterUpdateEvent {
	public type = 'AfterUpdateEvent' as const

	private _hasChanges: boolean | undefined

	constructor(
		public readonly entity: Model.Entity,
		public readonly data: (ResolvedColumnValue & { old: Value.FieldValue })[],
		public readonly id: Input.PrimaryValue,
	) {
	}
	get hasChanges() {
		// todo: deep equals
		return this._hasChanges = this.data.some(it => it.resolvedValue !== it.old)
	}
}

export class BeforeDeleteEvent {
	public type = 'BeforeDeleteEvent' as const

	constructor(
		public readonly entity: Model.Entity,
		public readonly id: Input.PrimaryValue,
	) {
	}
}

export class BeforeJunctionUpdateEvent {
	public type = 'BeforeJunctionUpdateEvent' as const

	public afterEvent: AfterJunctionUpdateEvent | undefined = undefined

	constructor(
		public readonly owningEntity: Model.Entity,
		public readonly owningRelation: Model.ManyHasManyOwningRelation,
		public readonly owningId: Input.PrimaryValue,
		public readonly inverseId: Input.PrimaryValue,
		public readonly operation: 'connect' | 'disconnect',
	) {
	}
}


export class AfterJunctionUpdateEvent {
	public type = 'AfterJunctionUpdateEvent' as const

	constructor(
		public readonly owningEntity: Model.Entity,
		public readonly owningRelation: Model.ManyHasManyOwningRelation,
		public readonly owningId: Input.PrimaryValue,
		public readonly inverseId: Input.PrimaryValue,
		public readonly operation: 'connect' | 'disconnect',
		public readonly hasChanges: boolean,
	) {
	}
}

export class BeforeCommitEvent {
	public type = 'BeforeCommitEvent' as const
}

export class AfterCommitEvent {
	public type = 'AfterCommitEvent' as const
}

export type DataModificationEvent =
	| BeforeInsertEvent
	| AfterInsertEvent
	| BeforeUpdateEvent
	| AfterUpdateEvent
	| BeforeJunctionUpdateEvent
	| AfterJunctionUpdateEvent
	| BeforeDeleteEvent

export type AnyEvent =
	| DataModificationEvent
	| BeforeCommitEvent
	| AfterCommitEvent

export type EventMap<E extends AnyEvent = AnyEvent> = {
	[K in E['type']]: E extends { type: K } ? E : never
}

export type EventListener<K extends keyof EventMap> = (event: EventMap[K], mapper: Mapper) => Promise<void>

export class EventManager {
	private listeners: { [K in keyof EventMap]: EventListener<K>[] } = {
		BeforeInsertEvent: [],
		AfterInsertEvent: [],
		BeforeUpdateEvent: [],
		AfterUpdateEvent: [],
		BeforeDeleteEvent: [],
		BeforeCommitEvent: [],
		AfterCommitEvent: [],
		BeforeJunctionUpdateEvent: [],
		AfterJunctionUpdateEvent: [],
	}

	constructor(
		private readonly mapper: Mapper,
	) {
	}

	public listen<K extends keyof EventMap>(type: K, cb: EventListener<K>) {
		this.listeners[type].push(cb)
	}

	public async fire<K extends keyof EventMap>(event: EventMap[K]) {
		(await Promise.allSettled(this.listeners[event.type].map(it => (it as EventListener<K>)(event, this.mapper))))
			.map(it => {
				if (it.status === 'rejected') {
					logger.error(it.reason)
				}
			})
	}
}
