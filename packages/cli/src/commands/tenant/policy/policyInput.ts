import { CliError, ExitCode } from '@contember/cli-common'
import type { AuthPolicyInput, AuthPolicyScope, MailType } from '@contember/graphql-client-tenant'
import { readStdinText, type StdinReader } from '../../../lib/tenant/stdin.js'
import { literalInput, resolveRequiredTenantInput, stdinInput, type TenantInputSource } from '../../../lib/tenant/input/index.js'
import { humanText } from '../tenantOutput.js'

/**
 * Structured input (an `AuthPolicyInput`, a mail template body) is taken verbatim as text, either inline
 * or from stdin, instead of being reassembled from a flag-per-field mini-syntax. Stdin needs its own
 * boolean flag: a bare `-` sentinel is impossible, `InputParser.tryParseValue` treats any value starting
 * with a dash as the next flag. Same shape as `member/membershipInput.ts`.
 */
export interface TextInputSources {
	/** What is being read, used in the error messages, e.g. `policy`. */
	label: string
	/** The value passed inline, e.g. `--policy '{"scope":"global","roles":[]}'`. */
	inline: string | undefined
	inlineFlag: string
	fromStdin: boolean
	stdinFlag: string
	/** Whether an explicitly selected empty value is meaningful. */
	allowEmpty?: boolean
}

/** Resolves the value from exactly one of: the inline flag or stdin. */
export const readTextInput = async (sources: TextInputSources, readStdin: StdinReader = readStdinText): Promise<string> => {
	const selected: TenantInputSource<'value'>[] = []
	if (sources.inline !== undefined) {
		selected.push(literalInput('value', sources.inlineFlag, sources.inline))
	}
	if (sources.fromStdin) {
		selected.push(stdinInput('value', sources.stdinFlag))
	}
	const resolved = await resolveRequiredTenantInput(selected, {
		label: sources.label,
		allowEmpty: sources.allowEmpty,
		trailingLineEnding: 'preserve',
	}, { readStdin })
	return resolved.value
}

export const AUTH_POLICY_JSON_EXAMPLE = '{"scope":"project","project":"blog","roles":["admin"],"mfaRequired":true,"idleTimeout":"PT30M"}'

const authPolicyScopes = {
	global: 'global',
	project: 'project',
} satisfies Record<AuthPolicyScope, AuthPolicyScope>

// `satisfies` keeps this exhaustive: a MailType added to the schema breaks the build here instead of
// silently going unsupported.
const mailTypes = {
	EXISTING_USER_INVITED: 'EXISTING_USER_INVITED',
	NEW_USER_INVITED: 'NEW_USER_INVITED',
	RESET_PASSWORD_REQUEST: 'RESET_PASSWORD_REQUEST',
	PASSWORDLESS_SIGN_IN: 'PASSWORDLESS_SIGN_IN',
	FORCED_SIGN_OUT: 'FORCED_SIGN_OUT',
	EMAIL_OTP: 'EMAIL_OTP',
	BACKUP_CODES_EXHAUSTED: 'BACKUP_CODES_EXHAUSTED',
	EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
	EMAIL_CHANGE_VERIFY: 'EMAIL_CHANGE_VERIFY',
	EMAIL_CHANGE_NOTIFY: 'EMAIL_CHANGE_NOTIFY',
	UNUSUAL_LOGIN: 'UNUSUAL_LOGIN',
} satisfies Record<MailType, MailType>

export const mailTypeValues: MailType[] = Object.values(mailTypes)

/** What identifies a mail template — it has no id, only this triple. Emitted as the result of add/remove. */
export interface MailTemplateRef {
	projectSlug: string | null
	type: MailType
	variant: string | null
}

export const describeMailTemplate = (ref: MailTemplateRef): string =>
	[
		ref.projectSlug === null ? 'global' : `project ${humanText(ref.projectSlug)}`,
		humanText(ref.type),
		ref.variant === null ? null : `variant ${humanText(ref.variant)}`,
	]
		.filter(it => it !== null)
		.join(', ')

/** Stable scalar form for quiet output. */
export const formatMailTemplateRef = (ref: MailTemplateRef): string => `${ref.projectSlug ?? 'global'}:${ref.type}:${ref.variant ?? 'default'}`

/** Case-insensitive, so `reset_password_request` works as well as the schema's `RESET_PASSWORD_REQUEST`. */
export const parseMailType = (value: string): MailType => {
	const normalized = value.toUpperCase()
	const found = mailTypeValues.find(it => it === normalized)
	if (found === undefined) {
		throw inputError(`Unknown mail type "${value}". Expected one of: ${mailTypeValues.join(', ')}.`, 'UNKNOWN_MAIL_TYPE')
	}
	return found
}

const authPolicyFields = [
	'scope',
	'project',
	'roles',
	'mfaRequired',
	'tokenExpiration',
	'idleTimeout',
	'mfaGraceDuration',
	'rememberMeAllowed',
]

/** Parses the `AuthPolicyInput` JSON document. Unknown keys are rejected so a typo is not silently dropped. */
export const parseAuthPolicyInput = (raw: string): AuthPolicyInput => {
	const record = asRecord(parseJson(raw))
	if (record === null) {
		throw inputError('The policy must be a JSON object.', 'INVALID_POLICY')
	}
	const unknownFields = Object.keys(record).filter(it => !authPolicyFields.includes(it))
	if (unknownFields.length > 0) {
		throw inputError(`Unknown policy field(s): ${unknownFields.join(', ')}. Expected: ${authPolicyFields.join(', ')}.`, 'INVALID_POLICY')
	}
	const scope = readEnum(record.scope, Object.values(authPolicyScopes), 'scope')
	const project = readOptionalString(record.project, 'project')
	if (scope === 'project' && (project === undefined || project === null)) {
		throw inputError('A project-scoped policy needs "project" (the project slug).', 'INVALID_POLICY')
	}
	if (scope === 'global' && project !== undefined && project !== null) {
		throw inputError('A global policy must not carry "project".', 'INVALID_POLICY')
	}
	return {
		scope,
		project,
		roles: readStringArray(record.roles, 'roles'),
		mfaRequired: readOptionalBoolean(record.mfaRequired, 'mfaRequired'),
		tokenExpiration: readOptionalString(record.tokenExpiration, 'tokenExpiration'),
		idleTimeout: readOptionalString(record.idleTimeout, 'idleTimeout'),
		mfaGraceDuration: readOptionalString(record.mfaGraceDuration, 'mfaGraceDuration'),
		rememberMeAllowed: readOptionalBoolean(record.rememberMeAllowed, 'rememberMeAllowed'),
	}
}

export const inputError = (message: string, code: string): CliError => new CliError(message, { code, exitCode: ExitCode.InputError })

const parseJson = (raw: string): unknown => {
	try {
		return JSON.parse(raw)
	} catch {
		throw new CliError('Cannot parse the policy as JSON.', {
			code: 'INVALID_JSON',
			exitCode: ExitCode.InputError,
		})
	}
}

/** Copies a plain JSON object into an indexable record — no cast, so every value stays `unknown`. */
const asRecord = (value: unknown): Record<string, unknown> | null => {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return null
	}
	const result: Record<string, unknown> = {}
	for (const [key, item] of Object.entries(value)) {
		result[key] = item
	}
	return result
}

const readEnum = <T extends string>(value: unknown, allowed: T[], field: string): T => {
	const found = allowed.find(it => it === value)
	if (found === undefined) {
		throw inputError(`"${field}" must be one of: ${allowed.join(', ')}.`, 'INVALID_POLICY')
	}
	return found
}

const readOptionalString = (value: unknown, field: string): string | null | undefined => {
	if (value === undefined || value === null) {
		return value
	}
	if (typeof value !== 'string') {
		throw inputError(`"${field}" must be a string.`, 'INVALID_POLICY')
	}
	return value
}

const readOptionalBoolean = (value: unknown, field: string): boolean | null | undefined => {
	if (value === undefined || value === null) {
		return value
	}
	if (typeof value !== 'boolean') {
		throw inputError(`"${field}" must be a boolean.`, 'INVALID_POLICY')
	}
	return value
}

const readStringArray = (value: unknown, field: string): string[] => {
	if (!Array.isArray(value)) {
		throw inputError(`"${field}" must be an array of strings.`, 'INVALID_POLICY')
	}
	const result: string[] = []
	for (const item of value) {
		if (typeof item !== 'string') {
			throw inputError(`"${field}" must be an array of strings.`, 'INVALID_POLICY')
		}
		result.push(item)
	}
	return result
}
