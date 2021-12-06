import { Command } from '../Command'
import { ConflictActionType, InsertBuilder } from '@contember/database'
import { MailTemplate } from '../../mailing'

export class AddMailTemplateCommand implements Command<void> {
	constructor(private mailTemplate: MailTemplate) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		await InsertBuilder.create()
			.into('mail_template')
			.values({
				id: providers.uuid(),
				project_id: this.mailTemplate.projectId ?? null,
				mail_type: this.mailTemplate.type,
				variant: this.mailTemplate.variant,
				subject: this.mailTemplate.subject,
				content: this.mailTemplate.content,
				use_layout: this.mailTemplate.useLayout,
			})
			.onConflict(ConflictActionType.update, this.mailTemplate.projectId ? {
				columns: ['project_id', 'mail_type', 'variant'],
				where: it => it.isNotNull('project_id'),
			} : {
				columns: ['mail_type', 'variant'],
				where: it => it.isNull('project_id'),
			}, {
				subject: expr => expr.select(['excluded', 'subject']),
				content: expr => expr.select(['excluded', 'content']),
				use_layout: expr => expr.select(['excluded', 'use_layout']),
			})
			.execute(db)
	}
}
