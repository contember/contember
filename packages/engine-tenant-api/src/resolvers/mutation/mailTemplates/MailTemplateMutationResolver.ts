import {
	AddMailTemplateErrorCode,
	AddMailTemplateResponse,
	MailType as SchemaMailType,
	MutationAddProjectMailTemplateArgs,
	MutationRemoveProjectMailTemplateArgs,
	MutationResolvers,
	RemoveMailTemplateErrorCode,
	RemoveMailTemplateResponse,
} from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { MailTemplateManager, MailType, PermissionActions, ProjectManager } from '../../../model'
import { createErrorResponse, createProjectNotFoundResponse } from '../../errorUtils'

export class MailTemplateMutationResolver implements MutationResolvers {
	constructor(
		private readonly projectManager: ProjectManager,
		private readonly mailTemplateManager: MailTemplateManager,
	) {}

	async addMailTemplate(
		parent: any,
		{ template: { content, projectSlug, subject, type, useLayout, variant } }: MutationAddProjectMailTemplateArgs,
		context: TenantResolverContext,
	): Promise<AddMailTemplateResponse> {
		const project = projectSlug ? await this.projectManager.getProjectBySlug(context.db, projectSlug) : null
		await context.requireAccess({
			scope: project ? await context.permissionContext.createProjectScope(project) : undefined,
			action: PermissionActions.MAIL_TEMPLATE_ADD,
			message: 'You are not allowed to add a mail template',
		})
		if (projectSlug && !project) {
			return createProjectNotFoundResponse('PROJECT_NOT_FOUND', projectSlug)
		}

		await this.mailTemplateManager.addMailTemplate(context.db, {
			content,
			projectId: project?.id,
			subject,
			useLayout: typeof useLayout === 'boolean' ? useLayout : true,
			variant: variant || '',
			type: this.mapMailType(type),
		})

		return {
			ok: true,
			errors: [],
		}
	}

	async removeMailTemplate(
		parent: any,
		{ templateIdentifier: { projectSlug, type, variant } }: MutationRemoveProjectMailTemplateArgs,
		context: TenantResolverContext,
	): Promise<RemoveMailTemplateResponse> {
		const project = projectSlug ? await this.projectManager.getProjectBySlug(context.db, projectSlug) : null
		await context.requireAccess({
			scope: project ? await context.permissionContext.createProjectScope(project) : undefined,
			action: PermissionActions.MAIL_TEMPLATE_REMOVE,
			message: 'You are not allowed to remove a mail template',
		})
		if (projectSlug && !project) {
			return createProjectNotFoundResponse('PROJECT_NOT_FOUND', projectSlug)
		}

		const removed = await this.mailTemplateManager.removeMailTemplate(context.db, {
			projectId: project?.id,
			variant: variant || '',
			type: this.mapMailType(type),
		})
		if (!removed) {
			return createErrorResponse('PROJECT_NOT_FOUND', 'Mail template not found')
		}

		return {
			ok: true,
			errors: [],
		}
	}

	private mapMailType(type: SchemaMailType): MailType {
		return {
			EXISTING_USER_INVITED: MailType.existingUserInvited,
			NEW_USER_INVITED: MailType.newUserInvited,
			RESET_PASSWORD_REQUEST: MailType.passwordReset,
		}[type]
	}
}
