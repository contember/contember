import {
	AddMailTemplateResponse,
	MutationAddProjectMailTemplateArgs,
	MutationRemoveProjectMailTemplateArgs,
	MutationResolvers,
	RemoveMailTemplateResponse,
} from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { MailTemplateManager, mailTypeFromSchemaToDb, PermissionActions, ProjectManager } from '../../../model'
import { createErrorResponse, createProjectNotFoundResponse } from '../../errorUtils'
import { validateEmail } from '../../../model/utils/email'

export class MailTemplateMutationResolver implements MutationResolvers {
	constructor(
		private readonly projectManager: ProjectManager,
		private readonly mailTemplateManager: MailTemplateManager,
	) {}

	async addMailTemplate(
		parent: any,
		{ template: { content, projectSlug, subject, type, useLayout, variant, replyTo } }: MutationAddProjectMailTemplateArgs,
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
		if (replyTo && !validateEmail(replyTo)) {
			return createErrorResponse('INVALID_REPLY_EMAIL_FORMAT', 'Reply-to email address is not in a valid format')
		}

		await this.mailTemplateManager.addMailTemplate(context.db, {
			content,
			projectId: project?.id ?? null,
			subject,
			useLayout: typeof useLayout === 'boolean' ? useLayout : true,
			variant: variant || '',
			type: mailTypeFromSchemaToDb(type),
			replyTo: replyTo?.trim() || null,
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
			projectId: project?.id ?? null,
			variant: variant || '',
			type: mailTypeFromSchemaToDb(type),
		})
		if (!removed) {
			return createErrorResponse('PROJECT_NOT_FOUND', 'Mail template not found')
		}

		return {
			ok: true,
			errors: [],
		}
	}
}
