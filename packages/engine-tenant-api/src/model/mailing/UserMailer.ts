import { Mailer, TemplateRenderer } from '../../utils'
import NewUserInvited from './templates/NewUserInvited.mustache'
import ExistingUserInvited from './templates/ExistingUserInvited.mustache'

export class UserMailer {
	constructor(private readonly mailer: Mailer, private readonly templateRenderer: TemplateRenderer) {}

	async sendNewUserInvitedMail(args: { email: string; password: string; project: string }): Promise<void> {
		const html = await this.templateRenderer.render(NewUserInvited, args)
		await this.mailer.send({
			to: args.email,
			subject: `You have been invited to ${args.project}`,
			html,
		})
	}

	async sendExistingUserInvitedEmail(args: { email: string; project: string }): Promise<void> {
		const html = await this.templateRenderer.render(ExistingUserInvited, args)
		await this.mailer.send({
			to: args.email,
			subject: `You have been invited to ${args.project}`,
			html,
		})
	}
}
