import { SelectBuilder } from '@contember/database'
import { MailTemplateData, MailTemplateIdentifier } from '../../mailing'

export type MailTemplateRow =
	& {
		readonly id: string
	}
	& MailTemplateData
	& MailTemplateIdentifier

export const createMailTemplateQuery = <T extends MailTemplateRow>() => SelectBuilder.create<T>()
	.select(['mail_template', 'id'])
	.select('subject')
	.select('content')
	.select('use_layout', 'useLayout')
	.select('reply_to', 'replyTo')
	.select('project_id', 'projectId')
	.select('mail_type', 'type')
	.select('variant')
	.from('mail_template')
