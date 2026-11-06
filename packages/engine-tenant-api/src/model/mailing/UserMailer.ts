import { Mailer, TemplateRenderer } from '../../utils/index.js'
import NewUserInvited from './templates/NewUserInvited.mustache.js'
import ExistingUserInvited from './templates/ExistingUserInvited.mustache.js'
import PasswordReset from './templates/PasswordReset.mustache.js'
import PasswordlessSignIn from './templates/PasswordlessSignIn.mustache.js'
import EmailOtp from './templates/EmailOtp.mustache.js'
import ForcedSignOut from './templates/ForcedSignOut.mustache.js'
import BackupCodesExhausted from './templates/BackupCodesExhausted.mustache.js'
import EmailVerification from './templates/EmailVerification.mustache.js'
import EmailChangeVerify from './templates/EmailChangeVerify.mustache.js'
import EmailChangeNotify from './templates/EmailChangeNotify.mustache.js'
import UnusualLogin from './templates/UnusualLogin.mustache.js'
import { MailTemplateData, MailTemplateIdentifier, MailType } from './type.js'
import { IdentityQuery, MailTemplateQuery, PersonRow } from '../queries/index.js'
import { holdsGlobalAdminRole } from '../authorization/index.js'
import Layout from './templates/Layout.mustache.js'
import { DatabaseContext } from '../utils/index.js'
import { EmailAddress } from '../utils/email.js'
import { Acl } from '@contember/schema'

export interface MailTemplateSelection {
	projectId: string | null
	variant: string
	/** The identity the mail is for; without one, project templates are not used. */
	recipientIdentityId: string | null
}

/** A mail to an existing person goes to its stored address; a person without one gets no mail. */
export type MailPerson = Pick<PersonRow, 'id' | 'email'>

export class UserMailer {
	constructor(
		private readonly mailer: Mailer,
		private readonly templateRenderer: TemplateRenderer,
	) {}

	async sendNewUserInvitedMail(
		dbContext: DatabaseContext,
		recipient: EmailAddress,
		mailArguments: {
			password: string | null
			token: string | null
			project: string
			projectSlug: string
			memberships: readonly Acl.Membership[]
		},
		customMailOptions: MailTemplateSelection,
	): Promise<void> {
		const templateId = { type: MailType.newUserInvited, projectId: customMailOptions.projectId, variant: customMailOptions.variant }
		const template = (await this.getCustomTemplate(dbContext, templateId, customMailOptions.recipientIdentityId)) || {
			subject: 'You have been invited to {{project}}',
			content: NewUserInvited,
			replyTo: null,
		}
		await this.sendMail(templateId, template, recipient.value, mailArguments)
	}

	async sendExistingUserInvitedEmail(
		dbContext: DatabaseContext,
		person: MailPerson,
		mailArguments: { project: string; projectSlug: string; memberships: readonly Acl.Membership[] },
		customMailOptions: MailTemplateSelection,
	): Promise<void> {
		const templateId = { type: MailType.existingUserInvited, projectId: customMailOptions.projectId, variant: customMailOptions.variant }
		const template = (await this.getCustomTemplate(dbContext, templateId, customMailOptions.recipientIdentityId)) || {
			subject: 'You have been invited to {{project}}',
			content: ExistingUserInvited,
			replyTo: null,
		}
		await this.sendMail(templateId, template, person.email, mailArguments)
	}

	async sendPasswordResetEmail(
		dbContext: DatabaseContext,
		person: MailPerson,
		mailArguments: { token: string; project?: string; projectSlug?: string },
		customMailOptions: MailTemplateSelection,
	): Promise<void> {
		const templateId = { type: MailType.passwordReset, projectId: customMailOptions.projectId, variant: customMailOptions.variant }
		const template = (await this.getCustomTemplate(dbContext, templateId, customMailOptions.recipientIdentityId)) || {
			subject: 'Password reset',
			content: PasswordReset,
			replyTo: null,
		}
		await this.sendMail(templateId, template, person.email, mailArguments)
	}

	async sendForcedSignOutEmail(
		dbContext: DatabaseContext,
		person: MailPerson,
		mailArguments: { reason: string | null },
		customMailOptions: MailTemplateSelection,
	): Promise<void> {
		const templateId = { type: MailType.forcedSignOut, projectId: customMailOptions.projectId, variant: customMailOptions.variant }
		const template = (await this.getCustomTemplate(dbContext, templateId, customMailOptions.recipientIdentityId)) || {
			subject: 'Your sessions have been signed out',
			content: ForcedSignOut,
			replyTo: null,
		}
		await this.sendMail(templateId, template, person.email, mailArguments)
	}

	async sendEmailVerificationEmail(
		dbContext: DatabaseContext,
		person: MailPerson,
		mailArguments: { token: string; project?: string; projectSlug?: string },
		customMailOptions: MailTemplateSelection,
	): Promise<void> {
		const templateId = { type: MailType.emailVerification, projectId: customMailOptions.projectId, variant: customMailOptions.variant }
		const template = (await this.getCustomTemplate(dbContext, templateId, customMailOptions.recipientIdentityId)) || {
			subject: 'Verify your e-mail address',
			content: EmailVerification,
			replyTo: null,
		}
		await this.sendMail(templateId, template, person.email, mailArguments)
	}

	async sendEmailChangeVerifyEmail(
		dbContext: DatabaseContext,
		recipient: EmailAddress,
		mailArguments: { token: string; project?: string; projectSlug?: string },
		customMailOptions: MailTemplateSelection,
	): Promise<void> {
		const templateId = { type: MailType.emailChangeVerify, projectId: customMailOptions.projectId, variant: customMailOptions.variant }
		const template = (await this.getCustomTemplate(dbContext, templateId, customMailOptions.recipientIdentityId)) || {
			subject: 'Confirm your new e-mail address',
			content: EmailChangeVerify,
			replyTo: null,
		}
		await this.sendMail(templateId, template, recipient.value, mailArguments)
	}

	async sendEmailChangeNotifyEmail(
		dbContext: DatabaseContext,
		person: MailPerson,
		mailArguments: { newEmail: string; project?: string; projectSlug?: string },
		customMailOptions: MailTemplateSelection,
	): Promise<void> {
		const templateId = { type: MailType.emailChangeNotify, projectId: customMailOptions.projectId, variant: customMailOptions.variant }
		const template = (await this.getCustomTemplate(dbContext, templateId, customMailOptions.recipientIdentityId)) || {
			subject: 'Your e-mail address was changed',
			content: EmailChangeNotify,
			replyTo: null,
		}
		await this.sendMail(templateId, template, person.email, mailArguments)
	}

	async sendPasswordlessEmail(
		dbContext: DatabaseContext,
		person: MailPerson,
		mailArguments: { token: string; project?: string; projectSlug?: string; url?: string; requestId: string },
		customMailOptions: MailTemplateSelection,
	): Promise<void> {
		const templateId = { type: MailType.passwordlessSignIn, projectId: customMailOptions.projectId, variant: customMailOptions.variant }
		const template = (await this.getCustomTemplate(dbContext, templateId, customMailOptions.recipientIdentityId)) || {
			subject: 'Sign in here',
			content: PasswordlessSignIn,
			replyTo: null,
		}
		await this.sendMail(templateId, template, person.email, mailArguments)
	}

	async sendEmailOtpEmail(
		dbContext: DatabaseContext,
		person: MailPerson,
		mailArguments: { code: string; project?: string; projectSlug?: string },
		customMailOptions: MailTemplateSelection,
	): Promise<void> {
		const templateId = { type: MailType.emailOtp, projectId: customMailOptions.projectId, variant: customMailOptions.variant }
		const template = (await this.getCustomTemplate(dbContext, templateId, customMailOptions.recipientIdentityId)) || {
			subject: 'Your verification code',
			content: EmailOtp,
			replyTo: null,
		}
		await this.sendMail(templateId, template, person.email, mailArguments)
	}

	async sendBackupCodesExhaustedEmail(
		dbContext: DatabaseContext,
		person: MailPerson,
		customMailOptions: MailTemplateSelection,
	): Promise<void> {
		const templateId = { type: MailType.backupCodesExhausted, projectId: customMailOptions.projectId, variant: customMailOptions.variant }
		const template = (await this.getCustomTemplate(dbContext, templateId, customMailOptions.recipientIdentityId)) || {
			subject: 'You have no MFA backup codes left',
			content: BackupCodesExhausted,
			replyTo: null,
		}
		await this.sendMail(templateId, template, person.email, {})
	}

	async sendUnusualLoginEmail(
		dbContext: DatabaseContext,
		person: MailPerson,
		mailArguments: { geoCountry: string | null; ipAddress: string | null },
		customMailOptions: MailTemplateSelection,
	): Promise<void> {
		const templateId = { type: MailType.unusualLogin, projectId: customMailOptions.projectId, variant: customMailOptions.variant }
		const template = (await this.getCustomTemplate(dbContext, templateId, customMailOptions.recipientIdentityId)) || {
			subject: 'Unusual sign-in to your account',
			content: UnusualLogin,
			replyTo: null,
		}
		await this.sendMail(templateId, template, person.email, mailArguments)
	}

	private async sendMail(
		templateId: MailTemplateIdentifier,
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
		recipientIdentityId: string | null,
	): Promise<Pick<MailTemplateData, 'subject' | 'content' | 'replyTo'> | null> {
		const template = await dbContext.queryHandler.fetch(new MailTemplateQuery(identifier))
		const usableTemplate = template !== null
				&& (identifier.projectId === null || await this.mayUseProjectTemplate(dbContext, template.trusted, recipientIdentityId))
			? template
			: null
		const customTemplate = usableTemplate ?? (await dbContext.queryHandler.fetch(new MailTemplateQuery({ ...identifier, projectId: null })))

		if (!customTemplate) {
			return null
		}
		const content = customTemplate.useLayout ? Layout(customTemplate.content) : customTemplate.content
		return { content, subject: customTemplate.subject, replyTo: customTemplate.replyTo }
	}

	/**
	 * A project template may be written by a project-scoped admin, so it must not reach a global admin
	 * (whose tokens give access to every project) unless a global admin wrote it.
	 */
	private async mayUseProjectTemplate(dbContext: DatabaseContext, trusted: boolean, recipientIdentityId: string | null): Promise<boolean> {
		if (trusted) {
			return true
		}
		if (recipientIdentityId === null) {
			return false
		}
		const [identity] = await dbContext.queryHandler.fetch(new IdentityQuery([recipientIdentityId]))
		return identity !== undefined && !holdsGlobalAdminRole(identity.roles)
	}
}
