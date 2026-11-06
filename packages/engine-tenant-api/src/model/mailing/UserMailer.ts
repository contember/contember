import { Mailer, TemplateRenderer } from '../../utils'
import NewUserInvited from './templates/NewUserInvited.mustache'
import ExistingUserInvited from './templates/ExistingUserInvited.mustache'
import PasswordReset from './templates/PasswordReset.mustache'
import PasswordlessSignIn from './templates/PasswordlessSignIn.mustache'
import { MailTemplateData, MailTemplateIdentifier, MailType } from './type'
import { MailTemplateQuery, PersonRow } from '../queries'
import Layout from './templates/Layout.mustache'
import { DatabaseContext } from '../utils'
import { EmailAddress } from '../utils/email'

/** A mail to an existing person goes to its stored address; a person without one gets no mail. */
export type MailPerson = Pick<PersonRow, 'id' | 'email'>

export class UserMailer {
	constructor(
		private readonly mailer: Mailer,
		private readonly templateRenderer: TemplateRenderer,
	) { }

	async sendNewUserInvitedMail(
		dbContext: DatabaseContext,
		recipient: EmailAddress,
		mailArguments: { password: string | null; token: string | null; project: string; projectSlug: string },
		customMailOptions: { projectId: string; variant: string },
	): Promise<void> {
		const template = (await this.getCustomTemplate(dbContext, { type: MailType.newUserInvited, ...customMailOptions })) || {
			subject: 'You have been invited to {{project}}',
			content: NewUserInvited,
			replyTo: null,
		}
		await this.sendTemplate(template, recipient.value, mailArguments)
	}

	async sendExistingUserInvitedEmail(
		dbContext: DatabaseContext,
		person: MailPerson,
		mailArguments: { project: string; projectSlug: string },
		customMailOptions: { projectId: string; variant: string },
	): Promise<void> {
		const template = (await this.getCustomTemplate(dbContext, { type: MailType.existingUserInvited, ...customMailOptions })) || {
			subject: 'You have been invited to {{project}}',
			content: ExistingUserInvited,
			replyTo: null,
		}
		await this.sendTemplate(template, person.email, mailArguments)
	}

	async sendPasswordResetEmail(
		dbContext: DatabaseContext,
		person: MailPerson,
		mailArguments: { token: string; project?: string; projectSlug?: string },
		customMailOptions: { projectId: string | null; variant: string },
	): Promise<void> {
		const template = (await this.getCustomTemplate(dbContext, { type: MailType.passwordReset, ...customMailOptions })) || {
			subject: 'Password reset',
			content: PasswordReset,
			replyTo: null,
		}
		await this.sendTemplate(template, person.email, mailArguments)
	}

	async sendPasswordlessEmail(
		dbContext: DatabaseContext,
		person: MailPerson,
		mailArguments: { token: string; project?: string; projectSlug?: string; url?: string },
		customMailOptions: { projectId: string | null; variant: string },
	): Promise<void> {
		const template = (await this.getCustomTemplate(dbContext, { type: MailType.passwordlessSignIn, ...customMailOptions })) || {
			subject: 'Sign in here',
			content: PasswordlessSignIn,
			replyTo: null,
		}
		await this.sendTemplate(template, person.email, mailArguments)
	}

	private async sendTemplate(
		template: Pick<MailTemplateData, 'subject' | 'content' | 'replyTo'>,
		recipient: string | null,
		mailArguments: Record<string, any>,
	) {
		if (recipient === null) {
			return
		}
		// Templates read the recipient as `{{email}}`.
		const variables = { ...mailArguments, email: recipient }
		const html = await this.templateRenderer.render(template.content, variables)
		await this.mailer.send({
			to: recipient,
			subject: await this.templateRenderer.render(template.subject, variables),
			html,
			...(template.replyTo ? {
				replyTo: template.replyTo,
			} : {}),
		})
	}

	private async getCustomTemplate(
		dbContext: DatabaseContext,
		identifier: MailTemplateIdentifier,
	): Promise<Pick<MailTemplateData, 'subject' | 'content' | 'replyTo'> | null> {
		const customTemplate =
			(await dbContext.queryHandler.fetch(new MailTemplateQuery(identifier)))
			?? (await dbContext.queryHandler.fetch(new MailTemplateQuery({ ...identifier, projectId: null })))

		if (!customTemplate) {
			return null
		}
		const content = customTemplate.useLayout ? Layout(customTemplate.content) : customTemplate.content
		return { content, subject: customTemplate.subject, replyTo: customTemplate.replyTo }
	}
}
