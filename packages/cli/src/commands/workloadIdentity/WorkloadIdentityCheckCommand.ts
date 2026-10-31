import { CliError, Command, CommandConfiguration, escapeTerminalText, ExitCode, Input, Output } from '@contember/cli-common'
import { TenantClientProvider } from '../../lib/TenantClientProvider.js'
import { readStdinText, StdinReader } from '../../lib/tenant/stdin.js'
import type { WorkloadIdentityTokenCheck } from '../../lib/tenant/workloadIdentity/model.js'

type Args = {}

type Options = {
	['token-stdin']?: boolean
}

/**
 * Runs the server-side verification of a workload token and explains the outcome. The token is read from
 * stdin only — argv lands in the shell history — and is never printed.
 */
export class WorkloadIdentityCheckCommand extends Command<Args, Options> {
	constructor(
		private readonly tenantClientProvider: TenantClientProvider,
		private readonly readStdin: StdinReader = readStdinText,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description(
			'Check why a workload identity token is accepted or rejected: the matched trust, the failing step and condition, '
				+ 'or the verified claims. Requires workloadIdentity:list. Exits with code 6 when the token is rejected.',
		)
		configuration.option('token-stdin').valueNone().description('Read the token (a compact JWT) from stdin.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<number> {
		if (input.getOption('token-stdin') !== true) {
			throw new CliError('No token given. Pass --token-stdin and pipe the token in.', {
				code: 'TOKEN_REQUIRED',
				exitCode: ExitCode.InputError,
			})
		}
		const token = (await this.readStdin()).trim()
		if (token === '') {
			throw new CliError('--token-stdin resolved to an empty value.', { code: 'EMPTY_SECRET', exitCode: ExitCode.InputError })
		}
		const result = await this.tenantClientProvider.project().checkWorkloadIdentityToken(token)
		output.data(result, {
			human: renderTokenCheck,
			quiet: it => it.ok ? 'ok' : it.failure?.step ?? 'rejected',
		})
		return result.ok ? ExitCode.Success : ExitCode.Forbidden
	}
}

const json = (value: unknown): string => escapeTerminalText(JSON.stringify(value, null, 2))

export const renderTokenCheck = (check: WorkloadIdentityTokenCheck): string => {
	const lines: string[] = []
	const trust = check.trust
	if (trust !== null) {
		lines.push(
			`Trust: ${escapeTerminalText(trust.slug)} (${trust.profile}${trust.disabled ? ', disabled' : ''})`,
			`  issuer: ${escapeTerminalText(trust.issuer)}`,
			`  audience: ${escapeTerminalText(trust.audience)}`,
		)
	} else {
		lines.push('Trust: no enabled trust matches the token issuer and audience')
	}
	if (check.ok) {
		lines.push('Result: accepted')
		if (check.requiresDpop !== null) {
			lines.push(`DPoP required: ${check.requiresDpop ? 'yes — every request must also carry a DPoP proof' : 'no'}`)
		}
		if (check.claims !== null) {
			lines.push('Verified claims:', json(check.claims))
		}
		return lines.join('\n')
	}
	const failure = check.failure
	if (failure === null) {
		lines.push('Result: rejected')
		return lines.join('\n')
	}
	lines.push(`Result: rejected at step ${failure.step}`, `Reason: ${escapeTerminalText(failure.message)}`)
	if (failure.conditionIndex !== null) {
		lines.push(`Failing condition: #${failure.conditionIndex} (0-based index in the trust's conditions)`)
		lines.push(`Actual claim value: ${failure.actualValue === null ? 'missing or null' : json(failure.actualValue)}`)
	}
	return lines.join('\n')
}
