import { ProjectSchemaResolver } from '../type'
import { MembershipValidationError, MembershipValidationErrorType, MembershipReader } from '@contember/schema-utils'
import { Acl } from '@contember/schema'

export class MembershipValidator {
	constructor(
		private readonly schemaResolver: ProjectSchemaResolver,
		private readonly reader: MembershipReader = new MembershipReader(),
	) {}

	async validate(project: string, memberships: readonly Acl.Membership[]): Promise<MembershipValidationError[]> {
		const schema = await this.schemaResolver.getSchema(project)
		if (!schema) {
			throw new Error()
		}
		return this.reader.read(schema.acl, memberships).errors
	}
}

export { MembershipValidationError, MembershipValidationErrorType }
