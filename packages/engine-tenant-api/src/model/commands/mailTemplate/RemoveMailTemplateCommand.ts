import { Command } from '../Command'
import { DeleteBuilder } from '@contember/database'
import { MailTemplateIdentifier } from '../../mailing'

export class RemoveMailTemplateCommand implements Command<boolean> {
	constructor(private mailTemplateIdentifier: MailTemplateIdentifier) {}

	async execute({ db, providers }: Command.Args): Promise<boolean> {
		return (
			(await DeleteBuilder.create()
				.from('mail_template')
				.where({
					project_id: this.mailTemplateIdentifier.projectId ?? null,
					mail_type: this.mailTemplateIdentifier.type,
					variant: this.mailTemplateIdentifier.variant,
				})
				.execute(db)) > 0
		)
	}
}
