import { Schema } from '@contember/schema'
import { ValidationError } from './errors'
import { AclValidator } from './AclValidator'
import { ModelValidator } from './ModelValidator'
import { isDeepStrictEqual } from 'util'

export class SchemaValidator {
	public static validate(schema: Schema): ValidationError[] {
		const aclValidator = new AclValidator(schema.model)
		const [acl, aclErrors] = aclValidator.validate(schema.acl)

		const modelValidator = new ModelValidator(schema.model)
		const [model, modelErrors] = modelValidator.validate()

		const validSchema = { ...schema, acl, model }

		const errors = [...aclErrors, ...modelErrors]
		if (errors.length === 0 && !isDeepStrictEqual(validSchema, schema)) {
			throw new Error('There is something wrong with a schema validator')
		}
		return errors
	}
}
