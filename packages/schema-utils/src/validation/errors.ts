export type ValidationErrorCode =
	| 'MODEL_NAME_MISMATCH'
	| 'MODEL_UNDEFINED_FIELD'
	| 'MODEL_INVALID_FIELD'
	| 'MODEL_UNDEFINED_ENTITY'
	| 'MODEL_RELATION_REQUIRED'
	| 'MODEL_INVALID_RELATION_DEFINITION'
	| 'MODEL_INVALID_COLUMN_DEFINITION'
	| 'MODEL_INVALID_VIEW_USAGE'
	| 'MODEL_INVALID_IDENTIFIER'
	| 'MODEL_INVALID_ENTITY_NAME'
	| 'MODEL_INVALID_CONSTRAINT'
	| 'MODEL_NAME_COLLISION'

	| 'ACL_INVALID_CONDITION'
	| 'ACL_UNDEFINED_VARIABLE'
	| 'ACL_UNDEFINED_FIELD'
	| 'ACL_UNDEFINED_PREDICATE'
	| 'ACL_UNDEFINED_ROLE'
	| 'ACL_UNDEFINED_ENTITY'

	| 'ACTIONS_NAME_MISMATCH'
	| 'ACTIONS_INVALID_CONDITION'
	| 'ACTIONS_UNDEFINED_FIELD'
	| 'ACTIONS_UNDEFINED_ENTITY'
	| 'ACTIONS_UNDEFINED_TRIGGER_TARGET'
	| 'ACTIONS_INVALID_SELECTION'

	| 'VALIDATION_UNDEFINED_ENTITY'
	| 'VALIDATION_UNDEFINED_FIELD'
	| 'VALIDATION_NOT_IMPLEMENTED'

export interface ValidationError {
	path: (string | number)[]
	message: string
	code: ValidationErrorCode
}

export class ErrorBuilder {
	constructor(public readonly errors: ValidationError[], private readonly path: string[] = []) {}

	for(...path: string[]): ErrorBuilder {
		return new ErrorBuilder(this.errors, [...this.path, ...path])
	}

	add(code: ValidationErrorCode, message: string): void {
		this.errors.push({ path: this.path, message, code })
	}
}
