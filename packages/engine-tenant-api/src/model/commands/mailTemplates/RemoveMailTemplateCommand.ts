import { Command } from '../Command'
import { ConflictActionType, DeleteBuilder, InsertBuilder } from '@contember/database'
import { MailTemplate, MailTemplateIdentifier } from '../../mailing'

export class RemoveMailTemplateCommand implements Command<boolean> {
	constructor(private mailTemplateIdentifier: MailTemplateIdentifier) {}

	async execute({ db, providers }: Command.Args): Promise<boolean> {
		return (
			(await DeleteBuilder.create()
				.from('mail_template')
				.where({
					project_id: this.mailTemplateIdentifier.projectId,
					mail_type: this.mailTemplateIdentifier.type,
					variant: this.mailTemplateIdentifier.variant,
				})
				.execute(db)) > 0
		)
	}
}
