import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { MailTemplateIdentifier } from '../../mailing/index.js'
import { createMailTemplateQuery, MailTemplateRow } from './helpers.js'

export type MailTemplateWithTrustRow = MailTemplateRow & { readonly trusted: boolean }

export class MailTemplateQuery extends DatabaseQuery<MailTemplateWithTrustRow | null> {
	constructor(
		private mailTemplateIdentifier: MailTemplateIdentifier,
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<MailTemplateWithTrustRow | null> {
		const rows = await createMailTemplateQuery<MailTemplateWithTrustRow>()
			.select('trusted')
			.where({
				project_id: this.mailTemplateIdentifier.projectId,
				mail_type: this.mailTemplateIdentifier.type,
				variant: this.mailTemplateIdentifier.variant,
			})
			.getResult(db)

		return this.fetchOneOrNull(rows)
	}
}
