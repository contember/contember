import {
	AddMailTemplateResponse,
	MutationAddProjectMailTemplateArgs,
	MutationRemoveProjectMailTemplateArgs,
	MutationResolvers,
	RemoveMailTemplateResponse,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { MailTemplateManager, mailTypeFromSchemaToDb, PermissionActions, ProjectManager } from '../../../model/index.js'
import { createErrorResponse, createProjectNotFoundResponse } from '../../errorUtils.js'
import { validateEmail } from '../../../model/utils/email.js'
import { ResponseOk } from '../../../model/utils/Response.js'

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
		const hasProject = projectSlug !== null && projectSlug !== undefined
		const project = hasProject ? await this.projectManager.getProjectBySlug(context.db, projectSlug) : null
		await context.requireAccess({
			scope: hasProject ? await context.permissionContext.createProjectScope(project) : undefined,
			action: PermissionActions.MAIL_TEMPLATE_ADD({
				kind: hasProject ? 'project' : 'global',
				projectSlug: hasProject ? projectSlug : null,
				type,
			}),
			message: 'You are not allowed to add a mail template',
		})
		if (hasProject && !project) {
			return createProjectNotFoundResponse('PROJECT_NOT_FOUND', projectSlug)
		}
		if (replyTo && !validateEmail(replyTo)) {
			return createErrorResponse('INVALID_REPLY_EMAIL_FORMAT', 'Reply-to email address is not in a valid format')
		}

		await context.db.transaction(async db => {
			await this.mailTemplateManager.addMailTemplate(db, {
				content,
				projectId: project?.id ?? null,
				subject,
				useLayout: typeof useLayout === 'boolean' ? useLayout : true,
				variant: variant || '',
				type: mailTypeFromSchemaToDb(type),
				replyTo: replyTo?.trim() || null,
			})

			await context.logAuthAction({
				type: 'mail_template_change',
				response: new ResponseOk(null),
				eventData: {
					action: 'add',
					projectSlug: project?.slug ?? null,
					mailType: type,
					variant: variant || '',
				},
			}, db)
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
		const hasProject = projectSlug !== null && projectSlug !== undefined
		const project = hasProject ? await this.projectManager.getProjectBySlug(context.db, projectSlug) : null
		await context.requireAccess({
			scope: hasProject ? await context.permissionContext.createProjectScope(project) : undefined,
			action: PermissionActions.MAIL_TEMPLATE_REMOVE({
				kind: hasProject ? 'project' : 'global',
				projectSlug: hasProject ? projectSlug : null,
				type,
			}),
			message: 'You are not allowed to remove a mail template',
		})
		if (hasProject && !project) {
			return createProjectNotFoundResponse('PROJECT_NOT_FOUND', projectSlug)
		}

		const removed = await context.db.transaction(async db => {
			const removed = await this.mailTemplateManager.removeMailTemplate(db, {
				projectId: project?.id ?? null,
				variant: variant || '',
				type: mailTypeFromSchemaToDb(type),
			})
			if (removed) {
				await context.logAuthAction({
					type: 'mail_template_change',
					response: new ResponseOk(null),
					eventData: {
						action: 'remove',
						projectSlug: project?.slug ?? null,
						mailType: type,
						variant: variant || '',
					},
				}, db)
			}
			return removed
		})
		if (!removed) {
			return createErrorResponse('TEMPLATE_NOT_FOUND', 'Mail template not found')
		}

		return {
			ok: true,
			errors: [],
		}
	}
}
