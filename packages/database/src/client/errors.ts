export class DatabaseError extends Error {
	public readonly code?: string
	public readonly originalMessage?: string
	public readonly previous: any

	constructor(errMessage: string, previous?: Error | any) {
		super(errMessage)
		if (previous) {
			const { message, stack, ...other } = previous
			const otherDefined = Object.fromEntries(Object.entries(other).filter(it => it[1] !== undefined))
			this.previous = { message, ...otherDefined }
			this.code = previous.code
			this.originalMessage = previous.message
		}
	}
}

export class ClientError extends DatabaseError {
	constructor(previous: Error | any) {
		super(`Database client error: ${'message' in previous ? previous.message : JSON.stringify(previous)}`, previous)
	}
}

export class QueryError extends DatabaseError {
	public readonly code?: string
	public readonly constraint?: string
	public readonly originalMessage?: string

	constructor(public readonly sql: string, public readonly parameters: any, public readonly previous: Error | any) {
		super(
			`Database query error: ${'message' in previous ? previous.message : JSON.stringify(previous)}
SQL: ${sql}
parameters: ${parameters}`,
			previous,
		)
		this.constraint = previous.constraint
	}
}

export class NotNullViolationError extends QueryError {}

export class ForeignKeyViolationError extends QueryError {}

export class UniqueViolationError extends QueryError {}

export class SerializationFailureError extends QueryError {}

export class InvalidDataError extends QueryError {}

export class TransactionAbortedError extends QueryError {}


