import { MembershipMatcher } from '@contember/engine-tenant-api'
import * as Typesafe from '@contember/typesafe'
import { Acl } from '@contember/schema'
import { HttpError } from '../common'
import { ProjectMembershipFetcher } from './ProjectMembershipFetcher'
import { MembershipReader, ParsedMembership } from '@contember/schema-utils'

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
		identity: { identityId: string; personId?: string; roles?: readonly string[] }
	}): Promise<readonly ParsedMembership[]> {

		const explicitMemberships = await this.projectMembershipFetcher.fetchMemberships(projectSlug, {
			id: identity.identityId,
			roles: identity.roles,
		})

		const implicitRoles = Object.entries(acl.roles).filter(([, role]) => role.implicit).map(([name]) => name)

		if (explicitMemberships.length === 0 && implicitRoles.length === 0) {
			const errorMessage = this.debug
				? `You are not allowed to access project ${projectSlug}`
				: `Project ${projectSlug} NOT found`
			throw new HttpError(errorMessage, 404)
		}

		const membershipReader = new MembershipReader()

		const assumedMemberships = this.readAssumedMemberships(request)
		if (assumedMemberships.length > 0) {
			const parsedMemberships = membershipReader.read(acl, assumedMemberships, identity)
			if (parsedMemberships.errors.length > 0) {
				throw new HttpError(
					`Invalid memberships in ${assumeMembershipHeader} header:\n` +
					parsedMemberships.errors.map(it => JSON.stringify(it)).join('\n'),
					400,
				)
			}
			this.verifyAssumedRoles(explicitMemberships, acl, assumedMemberships)

			return parsedMemberships.memberships
		}


		const explicitProjectRoles = explicitMemberships.map(it => it.role)
		const implicitRolesToAssign = implicitRoles.filter(it => !explicitProjectRoles.includes(it))

		return [
			// intentionally ignoring validation errors of stored memberships
			...membershipReader.read(acl, explicitMemberships, identity).memberships,
			...implicitRolesToAssign.map(it => ({ role: it, variables: [] })),
		]
	}

	private readAssumedMemberships(req: HeaderAccessor): readonly Acl.Membership[] {
		const value = req.get(assumeMembershipHeader).trim()
		if (value === '') {
			return []
		}
		let parsedValue: { memberships: readonly Acl.Membership[] }
		try {
			parsedValue = assumeMembershipValueType(JSON.parse(value))
		} catch (e: any) {
			throw new HttpError(`Invalid content of ${assumeMembershipHeader}: ${e.message}`, 400)
		}
		return parsedValue.memberships
	}

	private verifyAssumedRoles(explicitMemberships: readonly Acl.Membership[], acl: Acl.Schema, assumedMemberships: readonly Acl.Membership[]) {
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
