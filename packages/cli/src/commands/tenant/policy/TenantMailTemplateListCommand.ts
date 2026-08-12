import { Command, CommandConfiguration, Input, Output, OutputTableColumn } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { TenantMailTemplateData } from '../../../lib/tenant/clients/index.js'
import { humanText } from '../tenantOutput.js'
import { formatMailTemplateRef } from './policyInput.js'

type Args = {}
type Options = {}

const CONTENT_PREVIEW_LENGTH = 40

/** Human mode only — a full Mustache body would make the table unreadable. `--json` keeps it whole. */
const previewContent = (value: string): string => {
	const singleLine = humanText(value).replace(/\s+/g, ' ').trim()
	return singleLine.length > CONTENT_PREVIEW_LENGTH ? `${singleLine.slice(0, CONTENT_PREVIEW_LENGTH - 1)}…` : singleLine
}

const columns: OutputTableColumn<TenantMailTemplateData>[] = [
	{ field: 'projectSlug', name: 'Project' },
	{ field: 'type', name: 'Type' },
	{ field: 'variant', name: 'Variant' },
	{ field: 'subject', name: 'Subject' },
	{ field: 'useLayout', name: 'Layout' },
	{ field: 'replyTo', name: 'Reply to' },
	{ field: 'content', name: 'Content', format: previewContent },
]

export class TenantMailTemplateListCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('List the configured mail templates, global and project-scoped.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const templates = await this.tenantClientProvider.policy().listMailTemplates()
		if (output.isQuiet) {
			output.data(templates, { quiet: rows => rows.map(formatMailTemplateRef) })
			return
		}
		output.table(columns, templates, 'type')
		if (templates.length === 0) {
			output.info('No mail templates are configured. The built-in ones are used.')
		}
	}
}
