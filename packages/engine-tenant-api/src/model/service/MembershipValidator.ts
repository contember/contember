import { ProjectSchemaResolver } from '../type'
import { MembershipValidationError, MembershipValidationErrorType, MembershipValidator as InnerValidator } from '@contember/schema-utils'
import { Acl } from '@contember/schema'

export class MembershipValidator {
	constructor(
		private readonly schemaResolver: ProjectSchemaResolver,
		private readonly innerValidator: InnerValidator = new InnerValidator(),
	) {}

	async validate(project: string, memberships: readonly Acl.Membership[]): Promise<MembershipValidationError[]> {
		const schema = await this.schemaResolver.getSchema(project)
		if (!schema) {
			throw new Error()
		}
		return this.innerValidator.validate(schema, memberships)
	}
}

export { MembershipValidationError, MembershipValidationErrorType }
