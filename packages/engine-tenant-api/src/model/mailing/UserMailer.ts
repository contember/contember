import { Mailer, TemplateRenderer } from '../../utils/index.js'
import NewUserInvited from './templates/NewUserInvited.mustache.js'
import ExistingUserInvited from './templates/ExistingUserInvited.mustache.js'
import PasswordReset from './templates/PasswordReset.mustache.js'
import PasswordlessSignIn from './templates/PasswordlessSignIn.mustache.js'
import EmailOtp from './templates/EmailOtp.mustache.js'
import ForcedSignOut from './templates/ForcedSignOut.mustache.js'
import BackupCodesExhausted from './templates/BackupCodesExhausted.mustache.js'
import { MailTemplateData, MailTemplateIdentifier, MailType } from './type.js'
import { MailTemplateQuery } from '../queries/index.js'
import Layout from './templates/Layout.mustache.js'
import { DatabaseContext } from '../utils/index.js'
import { Acl } from '@contember/schema'

export class UserMailer {
	constructor(
		private readonly mailer: Mailer,
		private readonly templateRenderer: TemplateRenderer,
	) {}

	async sendNewUserInvitedMail(
		dbContext: DatabaseContext,
		mailArguments: {
			email: string
			password: string | null
			token: string | null
			project: string
			projectSlug: string
			memberships: readonly Acl.Membership[]
		},
		customMailOptions: { projectId: string; variant: string },
	): Promise<void> {
		const templateId = { type: MailType.newUserInvited, ...customMailOptions }
		const template = (await this.getCustomTemplate(dbContext, templateId)) || {
			subject: 'You have been invited to {{project}}',
			content: NewUserInvited,
			replyTo: null,
		}
		await this.sendMail(templateId, template, mailArguments)
	}

	async sendExistingUserInvitedEmail(
		dbContext: DatabaseContext,
		mailArguments: { email: string; project: string; projectSlug: string; memberships: readonly Acl.Membership[] },
		customMailOptions: { projectId: string; variant: string },
	): Promise<void> {
		const templateId = { type: MailType.existingUserInvited, ...customMailOptions }
		const template = (await this.getCustomTemplate(dbContext, templateId)) || {
			subject: 'You have been invited to {{project}}',
			content: ExistingUserInvited,
			replyTo: null,
		}
		await this.sendMail(templateId, template, mailArguments)
	}

	async sendPasswordResetEmail(
		dbContext: DatabaseContext,
		mailArguments: { email: string; token: string; project?: string; projectSlug?: string },
		customMailOptions: { projectId: string | null; variant: string },
	): Promise<void> {
		const templateId = { type: MailType.passwordReset, ...customMailOptions }
		const template = (await this.getCustomTemplate(dbContext, templateId)) || {
			subject: 'Password reset',
			content: PasswordReset,
			replyTo: null,
		}
		await this.sendMail(templateId, template, mailArguments)
	}

	async sendForcedSignOutEmail(
		dbContext: DatabaseContext,
		mailArguments: { email: string; reason: string | null },
		customMailOptions: { projectId: string | null; variant: string },
	): Promise<void> {
		const templateId = { type: MailType.forcedSignOut, ...customMailOptions }
		const template = (await this.getCustomTemplate(dbContext, templateId)) || {
			subject: 'Your sessions have been signed out',
			content: ForcedSignOut,
			replyTo: null,
		}
		await this.sendMail(templateId, template, mailArguments)
	}

	async sendPasswordlessEmail(
		dbContext: DatabaseContext,
		mailArguments: { email: string; token: string; project?: string; projectSlug?: string; url?: string; requestId: string },
		customMailOptions: { projectId: string | null; variant: string },
	): Promise<void> {
		const templateId = { type: MailType.passwordlessSignIn, ...customMailOptions }
		const template = (await this.getCustomTemplate(dbContext, templateId)) || {
			subject: 'Sign in here',
			content: PasswordlessSignIn,
			replyTo: null,
		}
		await this.sendMail(templateId, template, mailArguments)
	}

	async sendEmailOtpEmail(
		dbContext: DatabaseContext,
		mailArguments: { email: string; code: string; project?: string; projectSlug?: string },
		customMailOptions: { projectId: string | null; variant: string },
	): Promise<void> {
		const templateId = { type: MailType.emailOtp, ...customMailOptions }
		const template = (await this.getCustomTemplate(dbContext, templateId)) || {
			subject: 'Your verification code',
			content: EmailOtp,
			replyTo: null,
		}
		await this.sendMail(templateId, template, mailArguments)
	}

	async sendBackupCodesExhaustedEmail(
		dbContext: DatabaseContext,
		mailArguments: { email: string },
		customMailOptions: { projectId: string | null; variant: string },
	): Promise<void> {
		const templateId = { type: MailType.backupCodesExhausted, ...customMailOptions }
		const template = (await this.getCustomTemplate(dbContext, templateId)) || {
			subject: 'You have no MFA backup codes left',
			content: BackupCodesExhausted,
			replyTo: null,
		}
		await this.sendMail(templateId, template, mailArguments)
	}

	private async sendMail(
		templateId: MailTemplateIdentifier,
		template: Pick<MailTemplateData, 'subject' | 'content' | 'replyTo'>,
		variables: Record<string, any>,
	) {
		const html = await this.templateRenderer.render(template.content, variables)
		await this.mailer.send({
			to: variables.email,
			subject: await this.templateRenderer.render(template.subject, variables),
			html,
			variables,
			template: templateId,
			...(template.replyTo
				? {
					replyTo: template.replyTo,
				}
				: {}),
		})
	}

	private async getCustomTemplate(
		dbContext: DatabaseContext,
		identifier: MailTemplateIdentifier,
	): Promise<Pick<MailTemplateData, 'subject' | 'content' | 'replyTo'> | null> {
		const customTemplate = (await dbContext.queryHandler.fetch(new MailTemplateQuery(identifier)))
			?? (await dbContext.queryHandler.fetch(new MailTemplateQuery({ ...identifier, projectId: null })))

		if (!customTemplate) {
			return null
		}
		const content = customTemplate.useLayout ? Layout(customTemplate.content) : customTemplate.content
		return { content, subject: customTemplate.subject, replyTo: customTemplate.replyTo }
	}
}
