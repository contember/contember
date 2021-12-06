import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { MailTemplateData, MailTemplateIdentifier } from '../../mailing'

class MailTemplateQuery extends DatabaseQuery<MailTemplateQuery.Result> {
	constructor(
		private mailTemplateIdentifier: MailTemplateIdentifier,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<MailTemplateQuery.Result> {
		const rows = await SelectBuilder.create<MailTemplateQuery.Row>()
			.select('id')
			.select('subject')
			.select('content')
			.select('use_layout', 'useLayout')
			.from('mail_template')
			.where({
				project_id: this.mailTemplateIdentifier.projectId ?? null,
				mail_type: this.mailTemplateIdentifier.type,
				variant: this.mailTemplateIdentifier.variant,
			})
			.getResult(db)

		return this.fetchOneOrNull(rows)
	}
}

namespace MailTemplateQuery {
	export type Row = {
		readonly id: string
	} & MailTemplateData
	export type Result = null | Row
}

export { MailTemplateQuery }
