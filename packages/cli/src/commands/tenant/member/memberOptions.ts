import { CliError, ExitCode } from '@contember/cli-common'
import { humanText } from '../tenantOutput.js'

/**
 * Reads an option the parser already enforces as required. The parser guarantees presence, not a
 * non-empty value, and the option type stays optional — this keeps the command free of a cast.
 */
export const requireOptionValue = (value: string | undefined, name: string): string => {
	if (value === undefined || value === '') {
		throw new CliError(`Option --${name} is required and must not be empty.`, { code: 'INVALID_INPUT', exitCode: ExitCode.InputError })
	}
	return value
}

export const parseIntegerOption = (value: string | undefined, name: string): number | undefined => {
	if (value === undefined) {
		return undefined
	}
	const parsed = Number(value)
	if (!Number.isInteger(parsed) || parsed < 0) {
		throw new CliError(`Option --${name} must be a non-negative integer, got "${value}".`, { code: 'INVALID_INPUT', exitCode: ExitCode.InputError })
	}
	return parsed
}

/** Both the fetched `TenantMembership` and the `MembershipInput` sent to the API, which differ only in readonly-ness. */
export interface MembershipLike {
	readonly role: string
	readonly variables: readonly { readonly name: string; readonly values: readonly string[] }[]
}

/** Human-mode rendering of a membership list. `--json` and `--quiet` always see the raw structure. */
export const formatMemberships = (memberships: readonly MembershipLike[]): string =>
	memberships
		.map(it =>
			it.variables.length === 0
				? humanText(it.role)
				: `${humanText(it.role)} (${it.variables.map(v => `${humanText(v.name)}: ${v.values.map(humanText).join(', ')}`).join('; ')})`
		)
		.join(', ')
