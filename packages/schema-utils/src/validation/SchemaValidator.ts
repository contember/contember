import { Schema } from '@contember/schema'
import { ValidationError } from './errors'
import { AclValidator } from './AclValidator'
import { ModelValidator } from './ModelValidator'
import { isDeepStrictEqual } from 'util'
import { ValidationValidator } from './ValidationValidator'
import { deepCompare } from '../utils'

export class SchemaValidator {
	public static validate(schema: Schema): ValidationError[] {
		const aclValidator = new AclValidator(schema.model)
		const [acl, aclErrors] = aclValidator.validate(schema.acl)

		const modelValidator = new ModelValidator(schema.model)
		const [model, modelErrors] = modelValidator.validate()

		const validationValidator = new ValidationValidator(schema.model)
		const [validation, validationErrors] = validationValidator.validate(schema.validation)

		const validSchema = { ...schema, acl, model, validation }

		const errors = [...aclErrors, ...modelErrors, ...validationErrors]
		if (errors.length === 0 && !isDeepStrictEqual(validSchema, schema)) {
			const errors = deepCompare(validSchema, schema, [])
			let message = 'There is something wrong with a schema validator:'
			for (const err of errors) {
				message += '\n\t' + err.path.join('.') + ': ' + err.message
			}
			message += '\n\nPlease fill a bug report'
			throw new Error(message)
		}
		return errors
	}
}
