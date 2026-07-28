import {
	AddMailTemplateResponse,
	MailType,
	MutationAddProjectMailTemplateArgs,
	MutationRemoveProjectMailTemplateArgs,
	MutationResolvers,
	RemoveMailTemplateResponse,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import {
	MailTemplateManager,
	MailTemplatePermissionMeta,
	mailTypeFromSchemaToDb,
	PermissionActions,
	Project,
	ProjectManager,
} from '../../../model/index.js'
import { createErrorResponse, createProjectNotFoundResponse } from '../../errorUtils.js'
import { validateEmail } from '../../../model/utils/email.js'
import { ResponseOk } from '../../../model/utils/Response.js'
import { Authorizator } from '@contember/authorization'

export class MailTemplateMutationResolver implements MutationResolvers {
	constructor(
		private readonly projectManager: ProjectManager,
		private readonly mailTemplateManager: MailTemplateManager,
	) {}

	/** A mail template is either global or project-scoped; both the scope and the permission meta follow from that. */
	private async requireTemplateAccess(
		context: TenantResolverContext,
		projectSlug: string | null | undefined,
		type: MailType,
		action: (meta?: MailTemplatePermissionMeta) => Authorizator.Action<MailTemplatePermissionMeta | undefined>,
		message: string,
	): Promise<Project | null> {
		const hasProject = projectSlug !== null && projectSlug !== undefined
		const project = hasProject ? await this.projectManager.getProjectBySlug(context.db, projectSlug) : null
		await context.requireAccess({
			// an unknown slug must resolve to the denied project scope, never fall back to global
			scope: hasProject ? await context.permissionContext.createProjectScope(project) : undefined,
			action: action({
				kind: hasProject ? 'project' : 'global',
				projectSlug: hasProject ? projectSlug : null,
				type,
			}),
			message,
		})
		return project
	}

	async addMailTemplate(
		parent: any,
		{ template: { content, projectSlug, subject, type, useLayout, variant, replyTo } }: MutationAddProjectMailTemplateArgs,
		context: TenantResolverContext,
	): Promise<AddMailTemplateResponse> {
		const project = await this.requireTemplateAccess(
			context,
			projectSlug,
			type,
			PermissionActions.MAIL_TEMPLATE_ADD,
			'You are not allowed to add a mail template',
		)
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

		await context.logAuthAction({
			type: 'mail_template_change',
			response: new ResponseOk(null),
			eventData: {
				action: 'add',
				projectSlug: project?.slug ?? null,
				mailType: type,
				variant: variant || '',
			},
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
		const project = await this.requireTemplateAccess(
			context,
			projectSlug,
			type,
			PermissionActions.MAIL_TEMPLATE_REMOVE,
			'You are not allowed to remove a mail template',
		)
		if (projectSlug && !project) {
			return createProjectNotFoundResponse('PROJECT_NOT_FOUND', projectSlug)
		}

		const removed = await this.mailTemplateManager.removeMailTemplate(context.db, {
			projectId: project?.id ?? null,
			variant: variant || '',
			type: mailTypeFromSchemaToDb(type),
		})
		if (!removed) {
			return createErrorResponse('TEMPLATE_NOT_FOUND', 'Mail template not found')
		}

		await context.logAuthAction({
			type: 'mail_template_change',
			response: new ResponseOk(null),
			eventData: {
				action: 'remove',
				projectSlug: project?.slug ?? null,
				mailType: type,
				variant: variant || '',
			},
		})

		return {
			ok: true,
			errors: [],
		}
	}
}
