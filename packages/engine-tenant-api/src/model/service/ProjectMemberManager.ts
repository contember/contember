import {
	AddProjectMemberCommand,
	MembershipUpdateInput,
	RemoveProjectMemberCommand,
	RemoveProjectMemberResponse,
	UpdateProjectMemberCommand,
	UpdateProjectMemberResponse,
} from '../commands/index.js'
import {
	ProjectMemberMembership,
	ProjectMembershipByIdentityQuery,
	ProjectMembershipsForDisplayQuery,
	ProjectMembersQuery,
} from '../queries/index.js'
import { AddProjectMemberErrorCode, ProjectMembersInput } from '../../schema/index.js'
import { AccessVerifier, PermissionActions, TenantRole } from '../authorization/index.js'
import { indexListBy, notEmpty } from '../../utils/array.js'
import { createSetMembershipVariables } from './membershipUtils.js'
import { Acl, ProjectRole } from '@contember/schema'
import { Response } from '../utils/Response.js'
import { DatabaseContext } from '../utils/index.js'

export class ProjectMemberManager {
	async addProjectMember(
		dbContext: DatabaseContext,
		projectId: string,
		identityId: string,
		memberships: readonly Acl.Membership[],
	): Promise<AddProjectMemberResponse> {
		return await dbContext.transaction(async db => {
			return await db.commandBus.execute(
				new AddProjectMemberCommand(projectId, identityId, createSetMembershipVariables(memberships)),
			)
		})
	}

	async updateProjectMember(
		dbContext: DatabaseContext,
		projectId: string,
		identityId: string,
		memberships: readonly MembershipUpdateInput[],
	): Promise<UpdateProjectMemberResponse> {
		return await dbContext.transaction(
			async db => await db.commandBus.execute(new UpdateProjectMemberCommand(projectId, identityId, memberships)),
		)
	}

	async removeProjectMember(dbContext: DatabaseContext, projectId: string, identityId: string): Promise<RemoveProjectMemberResponse> {
		return await dbContext.transaction(
			async db => await db.commandBus.execute(new RemoveProjectMemberCommand(projectId, identityId)),
		)
	}

	async getAllProjectMemberships(
		dbContext: DatabaseContext,
		project: { id: string } | { slug: string },
		identity: { id: string; roles?: readonly string[] },
		verifier: AccessVerifier | undefined,
	): Promise<readonly Acl.Membership[]> {
		return [
			...this.getImplicitProjectMemberships(identity),
			...await this.getStoredProjectsMemberships(dbContext, project, identity, verifier),
		]
	}

	/** The listing counterpart of {@link getAllProjectMemberships}: a lapsed membership is reported as inactive, not dropped. */
	async getAllProjectMembershipsForDisplay(
		dbContext: DatabaseContext,
		project: { id: string } | { slug: string },
		identity: { id: string; roles?: readonly string[] },
		verifier: AccessVerifier | undefined,
	): Promise<readonly ProjectMemberMembership[]> {
		return [
			...this.getImplicitProjectMemberships(identity).map(membership => this.asDisplayMembership(identity.id, membership)),
			...await this.getStoredProjectMembershipsForDisplay(dbContext, project, identity, verifier),
		]
	}

	async getEffectiveProjectMemberships(
		dbContext: DatabaseContext,
		project: { id: string } | { slug: string },
		identity: { id: string; roles?: readonly string[] },
	): Promise<readonly Acl.Membership[]> {
		const implicit = this.getImplicitProjectMemberships(identity)
		if (implicit.length > 0) {
			return implicit
		}
		return await this.getStoredProjectsMemberships(dbContext, project, identity, undefined)
	}

	async getStoredProjectsMemberships(
		dbContext: DatabaseContext,
		project: { id: string } | { slug: string },
		identity: { id: string },
		verifier: AccessVerifier | undefined,
	): Promise<readonly Acl.Membership[]> {
		const memberships = await dbContext.queryHandler.fetch(
			new ProjectMembershipByIdentityQuery(project, [identity.id]),
		)
		if (verifier === undefined) {
			return memberships
		}
		return await this.filterMemberships(memberships, verifier)
	}

	async getStoredProjectMembershipsForDisplay(
		dbContext: DatabaseContext,
		project: { id: string } | { slug: string },
		identity: { id: string },
		verifier: AccessVerifier | undefined,
	): Promise<readonly ProjectMemberMembership[]> {
		const memberships = await dbContext.queryHandler.fetch(
			new ProjectMembershipsForDisplayQuery(project, [identity.id]),
		)
		if (verifier === undefined) {
			return memberships
		}
		return await this.filterMembershipsForDisplay(memberships, verifier)
	}

	/** A synthetic membership has no row, so it carries no lease and is never inactive. */
	private asDisplayMembership(identityId: string, membership: Acl.Membership): ProjectMemberMembership {
		return { identityId, membership, leaseExpiresAt: null, active: true }
	}

	private getImplicitProjectMemberships(identity: { id: string; roles?: readonly string[] }): readonly Acl.Membership[] {
		if (identity.roles?.includes(TenantRole.SUPER_ADMIN) || identity.roles?.includes(TenantRole.PROJECT_ADMIN)) {
			return [{ role: ProjectRole.ADMIN, variables: [] }]
		}
		return []
	}

	async getProjectMembers(
		dbContext: DatabaseContext,
		projectId: string,
		accessVerifier: AccessVerifier,
		input: ProjectMembersInput,
	): Promise<GetProjectMembersResponse> {
		return dbContext.transaction(async db => {
			const members = await db.queryHandler.fetch(new ProjectMembersQuery(projectId, input))
			const memberships = await db.queryHandler.fetch(
				new ProjectMembershipsForDisplayQuery(
					{ id: projectId },
					members.map(it => it.id),
				),
			)
			const filteredMemberships = await this.filterMembershipsForDisplay(memberships, accessVerifier)
			const byIdentity = indexListBy(filteredMemberships, 'identityId')
			// Only the verifier drops a member here; a lapsed lease leaves the row in place, listed as inactive.
			return members
				.map(it => (byIdentity[it.id] ? { identity: it, memberships: byIdentity[it.id] } : null))
				.filter(notEmpty)
		})
	}

	private async filterMemberships<T extends Acl.Membership>(
		memberships: readonly T[],
		verifier: AccessVerifier,
	): Promise<T[]> {
		const filteredMemberships: T[] = []
		for (const membership of memberships) {
			const filtered = await this.filterMembership(membership, verifier)
			if (filtered !== null) {
				filteredMemberships.push({ ...membership, variables: filtered.variables })
			}
		}

		return filteredMemberships
	}

	private async filterMembershipsForDisplay(
		memberships: readonly ProjectMemberMembership[],
		verifier: AccessVerifier,
	): Promise<ProjectMemberMembership[]> {
		const filteredMemberships: ProjectMemberMembership[] = []
		for (const row of memberships) {
			const membership = await this.filterMembership(row.membership, verifier)
			if (membership !== null) {
				filteredMemberships.push({ ...row, membership })
			}
		}

		return filteredMemberships
	}

	/** Null when the verifier hides the membership, by its role or by leaving one of its variables empty. */
	private async filterMembership(membership: Acl.Membership, verifier: AccessVerifier): Promise<Acl.Membership | null> {
		if (!(await verifier(PermissionActions.PROJECT_VIEW_MEMBER([{ role: membership.role, variables: [] }])))) {
			return null
		}
		const variables: { values: Acl.MembershipVariable['values']; name: string }[] = []
		for (const variable of membership.variables) {
			const values = await this.filterProjectMembershipVariableValues(membership, variable, verifier)
			if (values.length === 0) {
				return null
			}
			variables.push({ name: variable.name, values })
		}

		return { role: membership.role, variables }
	}

	private async filterProjectMembershipVariableValues(
		membership: Acl.Membership,
		variable: Acl.MembershipVariable,
		verifier: AccessVerifier,
	): Promise<Acl.MembershipVariable['values']> {
		const values = await Promise.all(
			variable.values.map(async (value): Promise<string | null> => {
				const subMembership = {
					role: membership.role,
					variables: [
						{
							name: variable.name,
							values: [value],
						},
					],
				}

				if (!(await verifier(PermissionActions.PROJECT_VIEW_MEMBER([subMembership])))) {
					return null
				}
				return value
			}),
		)
		return values.filter(notEmpty)
	}
}

export type AddProjectMemberResponse = Response<null, AddProjectMemberErrorCode>

export type GetProjectMembersResponse = {
	identity: { id: string }
	memberships: readonly ProjectMemberMembership[]
}[]
