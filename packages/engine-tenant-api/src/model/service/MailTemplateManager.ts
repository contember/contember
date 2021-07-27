import { AddMailTemplateCommand, RemoveMailTemplateCommand } from '../commands'
import { MailTemplate, MailTemplateIdentifier } from '../mailing'
import { DatabaseContext } from '../utils'

export class MailTemplateManager {
	constructor(private readonly dbContext: DatabaseContext) {}

	public async addMailTemplate(mailTemplate: MailTemplate): Promise<void> {
		await this.dbContext.commandBus.execute(new AddMailTemplateCommand(mailTemplate))
	}

	public async removeMailTemplate(mailTemplateId: MailTemplateIdentifier): Promise<boolean> {
		return await this.dbContext.commandBus.execute(new RemoveMailTemplateCommand(mailTemplateId))
	}
}
