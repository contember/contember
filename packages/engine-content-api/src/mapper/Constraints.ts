export abstract class ConstraintViolation extends Error {
	public abstract readonly entity?: string
	public abstract readonly field?: string
	public abstract readonly path: string[]
	public abstract readonly constraint: string
}

export class NotNullConstraintViolation extends ConstraintViolation {
	public readonly constraint = 'not_null'

	constructor(public readonly entity?: string, public readonly field?: string, public readonly path: string[] = []) {
		super(
			entity && field
				? `Not null constraint violation on ${entity}::${field} in path ${path.join('.')}`
				: 'Not null constraint violation on unknown field',
		)
	}
}

export class ForeignKeyViolation extends ConstraintViolation {
	public readonly constraint = 'foreign_key'

	constructor(public readonly entity?: string, public readonly field?: string, public readonly path: string[] = []) {
		super(
			entity && field
				? `Foreign key constraint violation on ${entity}::${field} in path ${path.join('.')}`
				: 'Foreign key constraint violation on unknown field',
		)
	}
}

export class UniqueKeyViolation extends ConstraintViolation {
	public readonly constraint = 'unique_key'

	constructor(public readonly entity?: string, public readonly field?: string, public readonly path: string[] = []) {
		super(
			entity && field
				? `Unique key constraint violation on ${entity}::${field} in path ${path.join('.')}`
				: 'Unique key constraint violation on unknown field',
		)
	}
}
