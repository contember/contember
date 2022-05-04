import { Membership, MembershipMatcher } from '@contember/engine-tenant-api'
import * as Typesafe from '@contember/typesafe'
import { Acl } from '@contember/schema'
import { HttpError } from '../common'
import { ProjectMembershipFetcher } from './ProjectMembershipFetcher'

const assumeMembershipHeader = 'x-contember-assume-membership'

interface HeaderAccessor {
	get(header: string): string
}

export class ProjectMembershipResolver {
	constructor(
		private readonly debug: boolean,
		private readonly projectMembershipFetcher: ProjectMembershipFetcher,
	) {
	}

	public async resolveMemberships({ request, acl, projectSlug, identity }: {
		acl: Acl.Schema
		request: HeaderAccessor
		projectSlug: string
		identity: { id: string; roles?: readonly string[] }
	}): Promise<readonly Membership[]> {

		const explicitMemberships = await this.projectMembershipFetcher.fetchMemberships(projectSlug, identity)

		const implicitRoles = Object.entries(acl.roles).filter(([, role]) => role.implicit).map(([name]) => name)

		if (explicitMemberships.length === 0 && implicitRoles.length === 0) {
			throw this.debug
				? new HttpError(`You are not allowed to access project ${projectSlug}`, 403)
				: new HttpError(`Project ${projectSlug} NOT found`, 404)
		}

		const assumedMemberships = this.readAssumedMemberships(request)
		if (assumedMemberships.length > 0) {
			this.verifyAssumedRoles(explicitMemberships, acl, assumedMemberships)

			return assumedMemberships
		}


		const explicitProjectRoles = explicitMemberships.map(it => it.role)
		const implicitRolesToAssign = implicitRoles.filter(it => !explicitProjectRoles.includes(it))

		return [
			...explicitMemberships,
			...implicitRolesToAssign.map(it => ({ role: it, variables: [] })),
		]
	}

	private readAssumedMemberships(req: HeaderAccessor): readonly Membership[] {
		const value = req.get(assumeMembershipHeader).trim()
		if (value === '') {
			return []
		}
		let parsedValue: { memberships: readonly Membership[] }
		try {
			parsedValue = assumeMembershipValueType(JSON.parse(value))
		} catch (e: any) {
			throw new HttpError(`Invalid content of ${assumeMembershipHeader}: ${e.message}`, 400)
		}
		return parsedValue.memberships
	}

	private verifyAssumedRoles(explicitMemberships: readonly Membership[], acl: Acl.Schema, assumedMemberships: readonly Membership[]) {
		const membershipMatcher = new MembershipMatcher(explicitMemberships.map(it => ({
			...it,
			matchRule: acl.roles[it.role].content?.assumeMembership ?? {},
		})))

		for (const assumed of assumedMemberships) {
			if (!membershipMatcher.matches(assumed)) {
				throw new HttpError(`You are not allow to assume membership ${JSON.stringify(assumed)}`, 403)
			}
		}
	}
}

const assumeMembershipValueType = Typesafe.object({
	memberships: Typesafe.array(
		Typesafe.object({
			role: Typesafe.string,
			variables: Typesafe.array(
				Typesafe.object({
					name: Typesafe.string,
					values: Typesafe.array(Typesafe.string),
				}),
			),
		}),
	),
})
