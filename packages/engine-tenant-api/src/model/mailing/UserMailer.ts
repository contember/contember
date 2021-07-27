import { Mailer, TemplateRenderer } from '../../utils'
import NewUserInvited from './templates/NewUserInvited.mustache'
import ExistingUserInvited from './templates/ExistingUserInvited.mustache'
import PasswordReset from './templates/PasswordReset.mustache'
import { MailTemplateData, MailTemplateIdentifier, MailType } from './type'
import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import { MailTemplateQuery } from '../queries/MailTemplateQuery'
import Layout from './templates/Layout.mustache'
import { DatabaseContext } from '../utils'

type SomeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export class UserMailer {
	constructor(
		private readonly mailer: Mailer,
		private readonly templateRenderer: TemplateRenderer,
		private readonly dbContext: DatabaseContext,
	) {}

	async sendNewUserInvitedMail(
		mailArguments: { email: string; password: string; project: string },
		customMailOptions: { projectId: string; variant: string },
	): Promise<void> {
		const template = (await this.getCustomTemplate({ type: MailType.newUserInvited, ...customMailOptions })) || {
			subject: 'You have been invited to {{project}}',
			content: NewUserInvited,
		}
		await this.sendTemplate(template, mailArguments)
	}

	async sendExistingUserInvitedEmail(
		mailArguments: { email: string; project: string },
		customMailOptions: { projectId: string; variant: string },
	): Promise<void> {
		const template = (await this.getCustomTemplate({ type: MailType.existingUserInvited, ...customMailOptions })) || {
			subject: 'You have been invited to {{project}}',
			content: ExistingUserInvited,
		}
		await this.sendTemplate(template, mailArguments)
	}

	async sendPasswordResetEmail(
		mailArguments: { email: string; token: string; project?: string },
		customMailOptions: { projectId?: string; variant: string },
	): Promise<void> {
		const template = (await this.getCustomTemplate({ type: MailType.passwordReset, ...customMailOptions })) || {
			subject: 'Password reset',
			content: PasswordReset,
		}
		await this.sendTemplate(template, mailArguments)
	}

	private async sendTemplate(
		template: Pick<MailTemplateData, 'subject' | 'content'>,
		mailArguments: Record<string, any>,
	) {
		const html = await this.templateRenderer.render(template.content, mailArguments)
		await this.mailer.send({
			to: mailArguments.email,
			subject: await this.templateRenderer.render(template.subject, mailArguments),
			html,
		})
	}

	private async getCustomTemplate(
		identifier: SomeOptional<MailTemplateIdentifier, 'projectId'>,
	): Promise<Pick<MailTemplateData, 'subject' | 'content'> | null> {
		if (!identifier.projectId) {
			return null
		}
		const customTemplate = await this.dbContext.queryHandler.fetch(
			new MailTemplateQuery(identifier.projectId, identifier.type, identifier.variant),
		)
		if (!customTemplate) {
			return null
		}
		const content = customTemplate.useLayout ? Layout(customTemplate.content) : customTemplate.content
		return { content, subject: customTemplate.subject }
	}
}
