import { EventType } from '../EventType'

export type ContentEvent = UpdateEvent | CreateEvent | DeleteEvent
export type Event = RunMigrationEvent | ContentEvent

export class RunMigrationEvent {
	public readonly type = EventType.runMigration

	constructor(public readonly id: string, public readonly transactionId: string, public readonly file: string) {}
}

export class UpdateEvent {
	public readonly type = EventType.update

	constructor(
		public readonly id: string,
		public readonly transactionId: string,
		public readonly rowId: string,
		public readonly tableName: string,
		public readonly values: { [column: string]: any }
	) {}
}

export class CreateEvent {
	public readonly type = EventType.create

	constructor(
		public readonly id: string,
		public readonly transactionId: string,
		public readonly rowId: string,
		public readonly tableName: string,
		public readonly values: { [column: string]: any }
	) {}
}

export class DeleteEvent {
	public readonly type = EventType.delete

	constructor(
		public readonly id: string,
		public readonly transactionId: string,
		public readonly rowId: string,
		public readonly tableName: string
	) {}
}
