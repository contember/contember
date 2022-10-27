import { MembershipMatcher } from '@contember/engine-tenant-api'
import * as Typesafe from '@contember/typesafe'
import { Acl } from '@contember/schema'
import { HttpErrorResponse } from '../common'
import { ProjectMembershipFetcher } from './ProjectMembershipFetcher'
import { MembershipResolver, ParsedMembership } from '@contember/schema-utils'
import { IncomingMessage } from 'http'

const assumeMembershipHeader = 'x-contember-assume-membership'

type HeaderAccessor = (header: string) => string

export class ProjectMembershipResolver {
	constructor(
		private readonly debug: boolean,
		private readonly projectMembershipFetcher: ProjectMembershipFetcher,
	) {
	}

	public async resolveMemberships({ getHeader, acl, projectSlug, identity }: {
		acl: Acl.Schema
		getHeader: HeaderAccessor
		projectSlug: string
		identity: { identityId: string; personId?: string; roles?: readonly string[] }
	}): Promise<{ effective: readonly ParsedMembership[]; fetched: readonly Acl.Membership[] }> {

		const explicitMemberships = await this.projectMembershipFetcher.fetchMemberships(projectSlug, {
			id: identity.identityId,
			roles: identity.roles,
		})

		const implicitRoles = Object.entries(acl.roles).filter(([, role]) => role.implicit).map(([name]) => name)

		const throwNotAllowed = () => {
			const errorMessage = this.debug
				? `You are not allowed to access project ${projectSlug}`
				: `Project ${projectSlug} NOT found`
			throw new HttpErrorResponse(404, errorMessage)
		}

		if (explicitMemberships.length === 0 && implicitRoles.length === 0) {
			throwNotAllowed()
		}

		const membershipResolver = new MembershipResolver()

		const assumedMemberships = this.readAssumedMemberships(getHeader)
		if (assumedMemberships !== null) {

			if (assumedMemberships.length === 0) {
				throwNotAllowed()
			}

			const parsedMemberships = membershipResolver.resolve(acl, assumedMemberships, identity)
			if (parsedMemberships.errors.length > 0) {
				throw new HttpErrorResponse(
					400,
					`Invalid memberships in ${assumeMembershipHeader} header:\n` +
					parsedMemberships.errors.map(it => JSON.stringify(it)).join('\n'),
				)
			}
			this.verifyAssumedRoles(explicitMemberships, acl, assumedMemberships)

			return { effective: parsedMemberships.memberships, fetched: explicitMemberships }
		}


		const explicitProjectRoles = explicitMemberships.map(it => it.role)
		const implicitRolesToAssign = implicitRoles.filter(it => !explicitProjectRoles.includes(it))

		return {
			effective: [
				// intentionally ignoring validation errors of stored memberships
				...membershipResolver.resolve(acl, explicitMemberships, identity).memberships,
				...implicitRolesToAssign.map(it => ({ role: it, variables: [] })),
			],
			fetched: explicitMemberships,
		}
	}

	private readAssumedMemberships(getHeader: HeaderAccessor): null | readonly Acl.Membership[] {
		const value = getHeader(assumeMembershipHeader)
		if (value === '') {
			return null
		}
		let parsedValue: { memberships: readonly Acl.Membership[] }
		try {
			parsedValue = assumeMembershipValueType(JSON.parse(value))
		} catch (e: any) {
			throw new HttpErrorResponse(400, `Invalid content of ${assumeMembershipHeader}: ${e.message}`)
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
				throw new HttpErrorResponse(403, `You are not allow to assume membership ${JSON.stringify(assumed)}`)
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
