export class ConnectionError extends Error {
	public readonly code?: string
	public readonly constraint?: string

	constructor(public readonly sql: string, public readonly parameters: any, public readonly previous: Error | any) {
		super(`Execution of SQL query has failed: 
SQL: ${sql}
parameters: ${parameters}
original message:
${'message' in previous ? previous.message : JSON.stringify(previous)}
`)
		this.code = previous.code
		this.constraint = previous.constraint
	}
}

export class NotNullViolationError extends ConnectionError {}

export class ForeignKeyViolationError extends ConnectionError {}

export class UniqueViolationError extends ConnectionError {}
