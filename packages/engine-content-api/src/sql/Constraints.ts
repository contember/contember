export abstract class ConstraintViolation extends Error {
	public abstract readonly entity: string
	public abstract readonly field: string
	public abstract readonly path: string[]
	public abstract readonly constraint: string
}

export class NotNullConstraintViolation extends ConstraintViolation {
	public readonly constraint = 'not_null'

	constructor(public readonly entity: string, public readonly field: string, public readonly path: string[] = []) {
		super(`Not null constraint violation on ${entity}::${field} in path ${path.join('.')}`)
	}
}
