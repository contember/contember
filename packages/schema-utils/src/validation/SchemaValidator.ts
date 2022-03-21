import { Schema } from '@contember/schema'
import { ValidationError } from './errors'
import { AclValidator } from './AclValidator'
import { ModelValidator } from './ModelValidator'
import { ValidationValidator } from './ValidationValidator'

export class SchemaValidator {
	public static validate(schema: Schema): ValidationError[] {
		const modelValidator = new ModelValidator(schema.model)
		const modelErrors = modelValidator.validate()

		const aclValidator = new AclValidator(schema.model)
		const aclErrors = aclValidator.validate(schema.acl)


		const validationValidator = new ValidationValidator(schema.model)
		const validationErrors = validationValidator.validate(schema.validation)

		return [...aclErrors, ...modelErrors, ...validationErrors]
	}
}
