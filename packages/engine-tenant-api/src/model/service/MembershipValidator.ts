import { ProjectSchemaResolver } from '../type'
import { MembershipValidationError, MembershipValidationErrorType, MembershipResolver } from '@contember/schema-utils'
import { Acl } from '@contember/schema'

export class MembershipValidator {
	constructor(
		private readonly schemaResolver: ProjectSchemaResolver,
		private readonly resolver: MembershipResolver = new MembershipResolver(),
	) {}

	async validate(project: string, memberships: readonly Acl.Membership[]): Promise<MembershipValidationError[]> {
		const schema = await this.schemaResolver.getSchema(project)
		if (!schema) {
			throw new Error()
		}
		return this.resolver.resolve(schema.acl, memberships).errors
	}
}

export { MembershipValidationError, MembershipValidationErrorType }
