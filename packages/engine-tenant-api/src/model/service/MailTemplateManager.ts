import { AddMailTemplateCommand, CommandBus, RemoveMailTemplateCommand } from '../commands'
import { MailTemplate, MailTemplateIdentifier } from '../mailing'

export class MailTemplateManager {
	constructor(private readonly commandBus: CommandBus) {}

	public async addMailTemplate(mailTemplate: MailTemplate): Promise<void> {
		await this.commandBus.execute(new AddMailTemplateCommand(mailTemplate))
	}

	public async removeMailTemplate(mailTemplateId: MailTemplateIdentifier): Promise<boolean> {
		return await this.commandBus.execute(new RemoveMailTemplateCommand(mailTemplateId))
	}
}
