import { Acl } from '@contember/schema'
import { DatabaseContext } from '../../../utils/index.js'
import { WorkloadIdentity } from '../../../type/index.js'

/** An envelope rule together with the stored membership it was declared on (§7a.1). */
export interface WorkloadAssumeRule {
	readonly membership: Acl.Membership
	readonly rule: Acl.MembershipMatchRule
}

export class WorkloadIdentityManager {
	/** Envelope rules of one trust in one project; a membership without a rule grants no assumption. */
	public async getAssumeRules(db: DatabaseContext, trustId: string, projectSlug: string): Promise<readonly WorkloadAssumeRule[]> {
		throw new Error('not implemented')
	}

	public async findTrustByIdentity(db: DatabaseContext, identityId: string): Promise<WorkloadIdentity.TrustRow | null> {
		throw new Error('not implemented')
	}
}
