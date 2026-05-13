import { Acl, JSONValue } from '@contember/schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { ProjectMembershipByIdentityQuery } from '../../../model/queries'
import { PersonByIdentityBatchQuery } from '../../../model/queries/person/PersonByIdentityBatchQuery'
import { ResponseOk } from '../../../model/utils/Response'
import { AuthActionType } from '../../../model/type/AuthLog'

export const logProjectMembershipChange = async (
	context: TenantResolverContext,
	auditType: Extract<AuthActionType, 'project_membership_create' | 'project_membership_update' | 'project_membership_remove'>,
	projectId: string,
	identityId: string,
	before: readonly Acl.Membership[],
): Promise<void> => {
	const after = auditType === 'project_membership_remove'
		? []
		: await context.db.queryHandler.fetch(new ProjectMembershipByIdentityQuery({ id: projectId }, [identityId]))
	const [targetPerson] = await context.db.queryHandler.fetch(new PersonByIdentityBatchQuery([identityId]))
	await context.logAuthAction({
		type: auditType,
		response: new ResponseOk(null),
		targetPersonId: targetPerson?.id,
		changeDiff: {
			projectId,
			identityId,
			before: before.map(membershipToJson),
			after: after.map(membershipToJson),
		},
	})
}

const membershipToJson = ({ role, variables }: Acl.Membership): JSONValue => ({
	role,
	variables: variables.map(({ name, values }) => ({ name, values: [...values] })),
})
