import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { MailTemplateIdentifier } from '../../mailing/index.js'
import { createMailTemplateQuery, MailTemplateRow } from './helpers.js'

export class MailTemplateQuery extends DatabaseQuery<MailTemplateRow | null> {
	constructor(
		private mailTemplateIdentifier: MailTemplateIdentifier,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<MailTemplateRow | null> {
		const rows = await createMailTemplateQuery()
			.where({
				project_id: this.mailTemplateIdentifier.projectId,
				mail_type: this.mailTemplateIdentifier.type,
				variant: this.mailTemplateIdentifier.variant,
			})
			.getResult(db)

		return this.fetchOneOrNull(rows)
	}
}
