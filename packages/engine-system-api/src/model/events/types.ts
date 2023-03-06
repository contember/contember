export enum EventType {
	delete = 'delete',
	update = 'update',
	create = 'create',
}

export type ContentEvent = UpdateEvent | CreateEvent | DeleteEvent

export interface Event {
	readonly type: EventType
	readonly id: string
	readonly createdAt: Date
	readonly transactionId: string
	// readonly errors?: string[]
}

export class UpdateEvent implements Event {
	public readonly type = EventType.update

	constructor(
		public readonly id: string,
		public readonly createdAt: Date,
		public readonly appliedAt: Date,
		public readonly identityId: string,
		public readonly transactionId: string,
		public readonly rowId: string[],
		public readonly tableName: string,
		public readonly values: { [column: string]: any },
	) {
	}
}

export class CreateEvent implements Event {
	public readonly type = EventType.create

	constructor(
		public readonly id: string,
		public readonly createdAt: Date,
		public readonly appliedAt: Date,
		public readonly identityId: string,
		public readonly transactionId: string,
		public readonly rowId: string[],
		public readonly tableName: string,
		public readonly values: { [column: string]: any },
	) {
	}
}

export class DeleteEvent implements Event {
	public readonly type = EventType.delete

	constructor(
		public readonly id: string,
		public readonly createdAt: Date,
		public readonly appliedAt: Date,
		public readonly identityId: string,
		public readonly transactionId: string,
		public readonly rowId: string[],
		public readonly tableName: string,
	) {
	}
}

