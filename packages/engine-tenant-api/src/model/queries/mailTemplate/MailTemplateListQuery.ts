import { DatabaseQuery, DatabaseQueryable } from '@contember/database'
import { createMailTemplateQuery, MailTemplateRow } from './helpers'

export type MailTemplateListRow =
	& MailTemplateRow
	& {
		projectSlug: string | null
	}
export class MailTemplateListQuery extends DatabaseQuery<MailTemplateListRow[]> {
	async fetch({ db }: DatabaseQueryable): Promise<MailTemplateListRow[]> {
		return await createMailTemplateQuery<MailTemplateListRow>()
			.leftJoin('project', undefined, expr => expr.columnsEq(['project', 'id'], ['mail_template', 'project_id']))
			.select(['project', 'slug'], 'projectSlug')
			.getResult(db)
	}
}
