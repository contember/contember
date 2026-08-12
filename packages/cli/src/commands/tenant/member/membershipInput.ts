import { CliError, CommandConfiguration, ExitCode } from '@contember/cli-common'
import type { MembershipInput } from '@contember/graphql-client-tenant'
import type { StdinReader } from '../../../lib/tenant/stdin.js'

/** `Arguments` is not part of the `@contember/cli-common` public surface, so the widest form is spelled out here. */
type AnyArguments = Record<string, string | string[] | undefined>

/**
 * The options every command taking `memberships: [MembershipInput!]!` declares.
 *
 * There are deliberately exactly two ways in, and no third one:
 *
 * - `--role <role>`, repeatable — a membership with no variables, which is the whole shape a human
 *   needs for `--role editor`;
 * - `--memberships <json>` / `--memberships-stdin` — the complete `MembershipInput[]` structure, which is
 *   what a script or an agent already holds.
 *
 * A compact string syntax for variables (`editor:locale=en,cs`) is intentionally not offered: it breaks
 * the moment a value contains the separator, and the JSON form costs an agent nothing.
 */
export type MembershipOptions = {
	role?: string[]
	memberships?: string
	['memberships-stdin']?: boolean
}

export const MEMBERSHIPS_JSON_EXAMPLE = '[{"role":"editor","variables":[{"name":"locale","values":["cs","en"]}]}]'

/** `roleDescription` exists for `tenant api-key create`, where `--role` also names a global tenant role. */
export const configureMembershipOptions = (
	configuration: CommandConfiguration<AnyArguments, MembershipOptions>,
	{ roleDescription = 'Membership role without variables. Repeat for several roles.' }: { roleDescription?: string } = {},
): void => {
	configuration.option('role').valueArray().description(roleDescription)
	configuration.option('memberships').valueRequired().description(
		`Memberships as JSON, e.g. '${MEMBERSHIPS_JSON_EXAMPLE}'. Not combinable with --role.`,
	)
	configuration.option('memberships-stdin').valueNone().description('Read the memberships JSON from stdin instead of --memberships.')
}

/** The raw values of {@link MembershipOptions}, read by the command so no generic `Input` has to be passed around. */
export interface MembershipInputSource {
	roles: string[] | undefined
	json: string | undefined
	fromStdin: boolean
}

export const readMembershipInputSource = (input: {
	getOption(name: 'role'): string[] | undefined
	getOption(name: 'memberships'): string | undefined
	getOption(name: 'memberships-stdin'): boolean | undefined
}): MembershipInputSource => ({
	roles: input.getOption('role'),
	json: input.getOption('memberships'),
	fromStdin: input.getOption('memberships-stdin') === true,
})

export const resolveMemberships = async (source: MembershipInputSource, readStdin: StdinReader): Promise<MembershipInput[]> => {
	const roles = source.roles ?? []
	const hasJson = source.json !== undefined
	if (hasJson && source.fromStdin) {
		throw membershipInputError('Pass the memberships either as --memberships or as --memberships-stdin, not both.')
	}
	if (roles.length > 0 && (hasJson || source.fromStdin)) {
		throw membershipInputError('Pass the memberships either as --role or as JSON (--memberships / --memberships-stdin), not both.')
	}
	if (roles.length > 0) {
		return roles.map(role => ({ role, variables: [] }))
	}
	if (hasJson) {
		return parseMemberships(source.json ?? '', '--memberships')
	}
	if (source.fromStdin) {
		return parseMemberships(await readStdin(), 'stdin')
	}
	throw membershipInputError(
		`No memberships given. Pass --role <role> for a role without variables, or the full structure as --memberships '${MEMBERSHIPS_JSON_EXAMPLE}'.`,
	)
}

const membershipInputError = (message: string, details?: unknown): CliError =>
	new CliError(message, { code: 'INVALID_MEMBERSHIPS', exitCode: ExitCode.InputError, details })

const parseMemberships = (json: string, origin: string): MembershipInput[] => {
	if (json.trim() === '') {
		throw membershipInputError(`Empty memberships JSON read from ${origin}.`)
	}
	let parsed: unknown
	try {
		parsed = JSON.parse(json)
	} catch (e) {
		throw membershipInputError(`Memberships read from ${origin} are not valid JSON: ${e instanceof Error ? e.message : String(e)}`)
	}
	if (!Array.isArray(parsed)) {
		throw membershipInputError(`Memberships read from ${origin} must be a JSON array, got ${describeJson(parsed)}.`)
	}
	return parsed.map((it, index) => parseMembership(it, `${origin}[${index}]`))
}

const parseMembership = (value: unknown, path: string): MembershipInput => {
	const record = asRecord(value, path)
	assertNoUnknownKeys(record, ['role', 'variables'], path)
	const role = record.role
	if (typeof role !== 'string' || role === '') {
		throw membershipInputError(`${path}.role must be a non-empty string.`)
	}
	const variables = record.variables
	if (variables === undefined || variables === null) {
		return { role, variables: [] }
	}
	if (!Array.isArray(variables)) {
		throw membershipInputError(`${path}.variables must be an array, got ${describeJson(variables)}.`)
	}
	return { role, variables: variables.map((it, index) => parseVariable(it, `${path}.variables[${index}]`)) }
}

const parseVariable = (value: unknown, path: string): { name: string; values: string[] } => {
	const record = asRecord(value, path)
	assertNoUnknownKeys(record, ['name', 'values'], path)
	const name = record.name
	if (typeof name !== 'string' || name === '') {
		throw membershipInputError(`${path}.name must be a non-empty string.`)
	}
	const values = record.values
	if (!Array.isArray(values) || values.some(it => typeof it !== 'string')) {
		throw membershipInputError(`${path}.values must be an array of strings.`)
	}
	return { name, values: values.filter(it => typeof it === 'string') }
}

const asRecord = (value: unknown, path: string): Record<string, unknown> => {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw membershipInputError(`${path} must be an object, got ${describeJson(value)}.`)
	}
	return { ...value }
}

// a typo'd key would otherwise be dropped without a word, which is the worst possible failure for a script
const assertNoUnknownKeys = (record: Record<string, unknown>, known: string[], path: string): void => {
	const unknown = Object.keys(record).filter(it => !known.includes(it))
	if (unknown.length > 0) {
		throw membershipInputError(`${path} has unknown ${unknown.length === 1 ? 'key' : 'keys'} ${unknown.join(', ')}. Allowed: ${known.join(', ')}.`)
	}
}

const describeJson = (value: unknown): string => (value === null ? 'null' : Array.isArray(value) ? 'an array' : typeof value)
