import { Schema } from '@contember/schema'
import { ValidationError } from './errors'
import { AclValidator } from './AclValidator'

export class SchemaValidator {
	public validate(schema: Schema): [Schema, ValidationError[]] {
		const aclValidator = new AclValidator(schema.model)
		const [acl, aclErrors] = aclValidator.validate(schema.acl)

		return [{ ...schema, acl }, [...aclErrors]]
	}
}
