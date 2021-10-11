import { AddMailTemplateCommand, RemoveMailTemplateCommand } from '../commands'
import { MailTemplate, MailTemplateIdentifier } from '../mailing'
import { DatabaseContext } from '../utils'

export class MailTemplateManager {
	public async addMailTemplate(dbContext: DatabaseContext, mailTemplate: MailTemplate): Promise<void> {
		await dbContext.commandBus.execute(new AddMailTemplateCommand(mailTemplate))
	}

	public async removeMailTemplate(dbContext: DatabaseContext, mailTemplateId: MailTemplateIdentifier): Promise<boolean> {
		return await dbContext.commandBus.execute(new RemoveMailTemplateCommand(mailTemplateId))
	}
}
