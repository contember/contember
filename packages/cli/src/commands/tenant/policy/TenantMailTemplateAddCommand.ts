import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { TenantMailTemplate } from '../../../lib/tenant/tenantConfig.js'
import { describeMailTemplate, formatMailTemplateRef, MailTemplateRef, mailTypeValues, parseMailType, readTextInput } from './policyInput.js'
import { readStdinText, StdinReader } from '../../../lib/tenant/stdin.js'

type Args = {
	type: string
}

type Options = {
	variant?: string
	project?: string
	/** Declared `required()` below, so the parser rejects the run before `execute` when it is missing. */
	subject: string
	content?: string
	['content-stdin']?: boolean
	['reply-to']?: string
	['no-layout']?: boolean
}

/**
 * The template is upserted by the (project, type, variant) triple. Scope lives in `--project`, not in a
 * separate command: `addProjectMailTemplate` is bound to the very same resolver and is deprecated in the
 * SDL in favour of `addMailTemplate`, whose input already carries `projectSlug`.
 */
export class TenantMailTemplateAddCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
		private readonly readStdin: StdinReader = readStdinText,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Add or replace a mail template. Existing templates with the same project, type and variant are overwritten.')
		configuration.argument('type').description(`Mail type. One of: ${mailTypeValues.join(', ')}.`)
		configuration.option('variant').valueRequired().description('Template variant, e.g. a locale. Defaults to the unnamed variant.')
		configuration.option('project').valueRequired().description('Project slug. Omit for a tenant-wide (global) template.')
		configuration.option('subject').valueRequired().required().description('Mail subject.')
		configuration.option('content').valueRequired().description('The template body as an inline string.')
		configuration.option('content-stdin').valueNone().description('Read the template body from stdin instead of --content.')
		configuration.option('reply-to').valueRequired().description('Reply-to address of the sent mail.')
		configuration.option('no-layout').valueNone().description('Do not wrap the body in the default layout.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const type = parseMailType(input.getArgument('type'))
		const subject = input.getOption('subject')
		const content = await readTextInput({
			label: 'template body',
			inline: input.getOption('content'),
			inlineFlag: '--content',
			fromStdin: input.getOption('content-stdin') === true,
			stdinFlag: '--content-stdin',
			allowEmpty: true,
		}, this.readStdin)

		const template: TenantMailTemplate = {
			type,
			subject,
			content,
			variant: input.getOption('variant'),
			projectSlug: input.getOption('project'),
			replyTo: input.getOption('reply-to'),
			// omitted means "use the server default", which is true — only an explicit opt-out is sent
			useLayout: input.getOption('no-layout') === true ? false : undefined,
		}

		await this.tenantClientProvider.policy().addMailTemplate(template)

		const ref: MailTemplateRef = {
			projectSlug: template.projectSlug ?? null,
			type,
			variant: template.variant ?? null,
		}
		output.data(ref, {
			human: value => `Added mail template (${describeMailTemplate(value)}).`,
			quiet: formatMailTemplateRef,
		})
	}
}
