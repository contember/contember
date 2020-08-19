import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { MailTemplateData, MailType } from '../mailing'

class MailTemplateQuery extends DatabaseQuery<MailTemplateQuery.Result> {
	constructor(
		private readonly projectId: string,
		private readonly mailType: MailType,
		private readonly variant: string,
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
				project_id: this.projectId,
				mail_type: this.mailType,
				variant: this.variant,
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
