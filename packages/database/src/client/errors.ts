export class ConnectionError extends Error {
	public readonly code?: string
	public readonly constraint?: string
	public readonly originalMessage?: string

	constructor(public readonly sql: string, public readonly parameters: any, public readonly previous: Error | any) {
		super(`Execution of SQL query has failed:
SQL: ${sql}
parameters: ${parameters}
original message:
${'message' in previous ? previous.message : JSON.stringify(previous)}
`)
		this.code = previous.code
		this.constraint = previous.constraint
		this.originalMessage = previous.message
	}
}

export class NotNullViolationError extends ConnectionError {}

export class ForeignKeyViolationError extends ConnectionError {}

export class UniqueViolationError extends ConnectionError {}

export class SerializationFailureError extends ConnectionError {}

export class InvalidDataError extends ConnectionError {}

export class TransactionAbortedError extends ConnectionError {}
