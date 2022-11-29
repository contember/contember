import { Schema } from '@contember/schema'
import { ValidationError, ValidationErrorCode } from './errors'
import { AclValidator } from './AclValidator'
import { ModelValidator } from './ModelValidator'
import { ValidationValidator } from './ValidationValidator'

export interface SchemaValidatorSkippedErrors {
	code: ValidationErrorCode
	path?: string
}

export class SchemaValidator {
	public static validate(schema: Schema, skippedErrors: SchemaValidatorSkippedErrors[] = []): ValidationError[] {
		const modelValidator = new ModelValidator(schema.model)
		const modelErrors = modelValidator.validate()

		const aclValidator = new AclValidator(schema.model)
		const aclErrors = aclValidator.validate(schema.acl)


		const validationValidator = new ValidationValidator(schema.model)
		const validationErrors = validationValidator.validate(schema.validation)
		const allErrors = [...aclErrors, ...modelErrors, ...validationErrors]
		if (skippedErrors.length === 0) {
			return allErrors
		}
		return allErrors.filter(
			err => !skippedErrors.some(
				rule => err.code === rule.code
					&& (!rule.path || err.path.join('.') === rule.path),
			),
		)
	}
}
