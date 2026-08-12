import { Command, CommandConfiguration, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../../lib/TenantClientProvider.js'
import { requireConfirmation } from '../../../lib/tenant/confirmation.js'
import { describeMailTemplate, formatMailTemplateRef, MailTemplateRef, mailTypeValues, parseMailType } from './policyInput.js'

type Args = {
	type: string
}

type Options = {
	variant?: string
	project?: string
	yes?: boolean
}

/** Counterpart of `mail-template add` — the same (project, type, variant) triple addresses the row. */
export class TenantMailTemplateRemoveCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Remove a mail template, so the built-in one is used again.')
		configuration.argument('type').description(`Mail type. One of: ${mailTypeValues.join(', ')}.`)
		configuration.option('variant').valueRequired().description('Template variant, e.g. a locale. Defaults to the unnamed variant.')
		configuration.option('project').valueRequired().description('Project slug. Omit to address the tenant-wide (global) template.')
		configuration.option('yes').valueNone().description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const ref: MailTemplateRef = {
			projectSlug: input.getOption('project') ?? null,
			type: parseMailType(input.getArgument('type')),
			variant: input.getOption('variant') ?? null,
		}
		const description = describeMailTemplate(ref)
		await requireConfirmation({
			yes: input.getOption('yes') === true,
			output,
			warning: `Mail template (${description}) will be removed and the built-in one used instead.`,
		})

		await this.tenantClientProvider.policy().removeMailTemplate({
			projectSlug: ref.projectSlug ?? undefined,
			type: ref.type,
			variant: ref.variant ?? undefined,
		})

		output.data(ref, {
			human: value => `Removed mail template (${describeMailTemplate(value)}).`,
			quiet: formatMailTemplateRef,
		})
	}
}
