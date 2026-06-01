import { MutationResolvers, MutationUpdateProjectMemberArgs, UpdateProjectMemberErrorCode, UpdateProjectMemberResponse } from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { MembershipValidationErrorType, MembershipValidator, PermissionActions, ProjectManager, ProjectMemberManager } from '../../../model/index.js'
import { createMembershipValidationErrorResult } from '../../membershipUtils.js'
import { createMembershipModification } from '../../../model/service/membershipUtils.js'
import { createErrorResponse, createProjectNotFoundResponse } from '../../errorUtils.js'
import { Acl } from '@contember/schema'
import { ProjectMembershipByIdentityQuery } from '../../../model/queries/index.js'
import { logProjectMembershipChange } from './audit.js'

export class UpdateProjectMemberMutationResolver implements MutationResolvers {
	constructor(
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly projectManager: ProjectManager,
		private readonly membershipValidator: MembershipValidator,
	) {}

	async updateProjectMember(
		parent: any,
		{ projectSlug, identityId, memberships }: MutationUpdateProjectMemberArgs,
		context: TenantResolverContext,
	): Promise<UpdateProjectMemberResponse> {
		const project = await this.projectManager.getProjectBySlug(context.db, projectSlug)
		const projectScope = await context.permissionContext.createProjectScope(project)
		await context.requireAccess({
			scope: projectScope,
			action: PermissionActions.PROJECT_UPDATE_MEMBER([]),
			message: 'You are not allowed to update project member variables',
		})
		if (!project) {
			return createProjectNotFoundResponse('PROJECT_NOT_FOUND', projectSlug)
		}
		const visibleMemberships = await this.projectMemberManager.getStoredProjectsMemberships(
			context.db,
			{ id: project.id },
			{ id: identityId },
			context.permissionContext.createAccessVerifier(projectScope),
		)
		const membershipPatch = createMembershipModification(visibleMemberships, memberships)

		const aclMemberships: Acl.Membership[] = membershipPatch.map(it => ({
			role: it.role,
			variables: it.variables.map(it => ({
				name: it.name,
				values: 'set' in it ? it.set : [...it.remove, ...it.append],
			})),
		}))

		await context.requireAccess({
			scope: projectScope,
			action: PermissionActions.PROJECT_UPDATE_MEMBER(aclMemberships),
			message: 'You are not allowed to update project member variables',
		})

		const validationResult = (await this.membershipValidator.validate(project.slug, memberships)).filter(
			it => it.error !== MembershipValidationErrorType.VARIABLE_EMPTY,
		)
		if (validationResult.length > 0) {
			const errors = createMembershipValidationErrorResult(validationResult)
			return {
				ok: false,
				errors: errors,
				error: errors[0],
			}
		}

		const before = await context.db.queryHandler.fetch(new ProjectMembershipByIdentityQuery({ id: project.id }, [identityId]))
		const result = await this.projectMemberManager.updateProjectMember(context.db, project.id, identityId, membershipPatch)

		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		await logProjectMembershipChange(context, 'project_membership_update', project.id, identityId, before)

		return {
			ok: true,
			errors: [],
		}
	}
}
