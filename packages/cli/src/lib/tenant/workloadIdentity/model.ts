import { CliError, ExitCode, type JsonValue } from '@contember/cli-common'
import type { Acl } from '@contember/schema'
import type { WorkloadIdentityProfile, WorkloadIdentityTokenCheckStep } from '@contember/graphql-client-tenant'
import type { TenantWorkloadIdentityProfile } from '../tenantConfig.js'

export type { WorkloadIdentityTokenCheckStep }

export interface RemoteWorkloadIdentityMembership {
	readonly project: string
	readonly role: string
	readonly variables: readonly { readonly name: string; readonly values: readonly string[] }[]
	readonly assumeMembership: Acl.MembershipMatchRule | null
}

/** A trust as `workloadIdentityTrusts` lists it, enabled or disabled; defaults are filled in by the server. */
export interface RemoteWorkloadIdentityTrust {
	readonly id: string
	readonly slug: string
	readonly profile: TenantWorkloadIdentityProfile
	readonly issuer: string
	readonly audience: string
	readonly jwksUri: string | null
	readonly signingAlgs: readonly string[]
	readonly acceptedTyp: readonly (string | null)[]
	readonly acceptAudienceArray: boolean
	readonly requireDpop: boolean
	/** Opaque JSON: the server validates conditions, the CLI only compares them. */
	readonly conditions: JsonValue
	readonly maxTokenLifetime: number
	readonly trustForwardedInfo: boolean
	readonly description: string | null
	readonly disabled: boolean
	readonly tokensValidAfter: string
	readonly roles: readonly string[]
	readonly memberships: readonly RemoteWorkloadIdentityMembership[]
}

export interface WorkloadEnvelopeClosureTarget {
	readonly role: string
	/** Concrete values, or `'*'` for an unbounded variable. */
	readonly variables: Readonly<Record<string, readonly string[] | '*'>>
	/** The target role's sensitive flags: `system.assumeIdentity`, `system.history`, `system.migrate` and the top-level `debug`. */
	readonly sensitiveSystemFlags: readonly string[]
}

export interface WorkloadEnvelopeClosureEntry {
	readonly project: string
	/** The role of the source membership the rule is bound to. */
	readonly role: string
	readonly targets: readonly WorkloadEnvelopeClosureTarget[]
}

/** `unrecognized` keeps a closure of an unexpected shape printable instead of failing an apply that already succeeded. */
export type WorkloadEnvelopeClosure =
	| { readonly entries: readonly WorkloadEnvelopeClosureEntry[] }
	| { readonly unrecognized: JsonValue }

export interface WorkloadIdentityApplyResult {
	readonly created: boolean
	readonly tokensValidAfterBumped: boolean
	readonly envelopeClosure: WorkloadEnvelopeClosure
}

export interface WorkloadIdentityTokenCheck {
	readonly ok: boolean
	readonly trust: {
		readonly slug: string
		readonly profile: TenantWorkloadIdentityProfile
		readonly issuer: string
		readonly audience: string
		readonly disabled: boolean
	} | null
	readonly failure: {
		readonly step: WorkloadIdentityTokenCheckStep
		readonly message: string
		readonly conditionIndex: number | null
		readonly actualValue: JsonValue | null
	} | null
	readonly claims: JsonValue | null
	readonly requiresDpop: boolean | null
}

export const toApiWorkloadProfile = (profile: TenantWorkloadIdentityProfile): WorkloadIdentityProfile => {
	switch (profile) {
		case 'oidc':
			return 'oidc'
		case 'github-actions':
			return 'github_actions'
	}
}

export const fromApiWorkloadProfile = (profile: WorkloadIdentityProfile): TenantWorkloadIdentityProfile => {
	switch (profile) {
		case 'oidc':
			return 'oidc'
		case 'github_actions':
			return 'github-actions'
	}
}

const invalidResponse = (message: string): CliError =>
	new CliError(`Tenant API returned an invalid workload identity response: ${message}`, {
		code: 'TENANT_API_INVALID_RESPONSE',
		exitCode: ExitCode.InternalError,
	})

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

/** Validates a GraphQL `Json` scalar value; returns `undefined` for anything JSON cannot carry. */
export const toJsonValue = (value: unknown): JsonValue | undefined => {
	if (value === null || typeof value === 'string' || typeof value === 'boolean') {
		return value
	}
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : undefined
	}
	if (Array.isArray(value)) {
		const items: JsonValue[] = []
		for (const item of value) {
			const parsed = toJsonValue(item)
			if (parsed === undefined) {
				return undefined
			}
			items.push(parsed)
		}
		return items
	}
	if (isRecord(value)) {
		const result: { [key: string]: JsonValue } = {}
		for (const [key, item] of Object.entries(value)) {
			const parsed = toJsonValue(item)
			if (parsed === undefined) {
				return undefined
			}
			result[key] = parsed
		}
		return result
	}
	return undefined
}

export const parseJsonScalar = (value: unknown, field: string): JsonValue => {
	const parsed = toJsonValue(value)
	if (parsed === undefined) {
		throw invalidResponse(`${field} is not JSON`)
	}
	return parsed
}

const parseVariablesMatchRule = (value: unknown): Acl.MembershipVariablesMatchRule | undefined => {
	if (value === true) {
		return true
	}
	if (!isRecord(value)) {
		return undefined
	}
	const result: Record<string, Acl.MembershipVariableMatchRule> = {}
	for (const [name, rule] of Object.entries(value)) {
		if (rule !== true && typeof rule !== 'string') {
			return undefined
		}
		result[name] = rule
	}
	return result
}

/** Parses a stored envelope rule into `Acl.MembershipMatchRule`; `null` when the membership has none. */
export const parseMembershipMatchRule = (value: unknown): Acl.MembershipMatchRule | null => {
	if (value === null || value === undefined) {
		return null
	}
	if (typeof value === 'boolean') {
		return value
	}
	if (!isRecord(value)) {
		throw invalidResponse('assumeMembership is not a membership match rule')
	}
	const result: Record<string, Acl.MembershipRoleMatchRule> = {}
	for (const [role, rule] of Object.entries(value)) {
		if (rule === true) {
			result[role] = true
			continue
		}
		if (!isRecord(rule)) {
			throw invalidResponse(`assumeMembership rule for role "${role}" is invalid`)
		}
		if (rule.variables === undefined) {
			result[role] = {}
			continue
		}
		const variables = parseVariablesMatchRule(rule.variables)
		if (variables === undefined) {
			throw invalidResponse(`assumeMembership variables for role "${role}" are invalid`)
		}
		result[role] = { variables }
	}
	return result
}

const parseClosureVariables = (value: unknown): Record<string, readonly string[] | '*'> | undefined => {
	if (value === undefined) {
		return {}
	}
	if (!isRecord(value)) {
		return undefined
	}
	const result: Record<string, readonly string[] | '*'> = {}
	for (const [name, values] of Object.entries(value)) {
		if (values === '*') {
			result[name] = '*'
		} else if (Array.isArray(values) && values.every((it): it is string => typeof it === 'string')) {
			result[name] = values
		} else {
			return undefined
		}
	}
	return result
}

const parseStringList = (value: unknown): readonly string[] | undefined =>
	value === undefined ? [] : Array.isArray(value) && value.every((it): it is string => typeof it === 'string') ? value : undefined

const parseClosureTarget = (value: unknown): WorkloadEnvelopeClosureTarget | undefined => {
	if (!isRecord(value) || typeof value.role !== 'string') {
		return undefined
	}
	const variables = parseClosureVariables(value.variables)
	const sensitiveSystemFlags = parseStringList(value.sensitiveFlags)
	if (variables === undefined || sensitiveSystemFlags === undefined) {
		return undefined
	}
	return { role: value.role, variables, sensitiveSystemFlags }
}

const parseClosureEntry = (value: unknown): WorkloadEnvelopeClosureEntry | undefined => {
	if (!isRecord(value) || typeof value.project !== 'string' || !isRecord(value.membership) || !Array.isArray(value.targets)) {
		return undefined
	}
	const role = value.membership.role
	if (typeof role !== 'string') {
		return undefined
	}
	const targets: WorkloadEnvelopeClosureTarget[] = []
	for (const item of value.targets) {
		const target = parseClosureTarget(item)
		if (target === undefined) {
			return undefined
		}
		targets.push(target)
	}
	return { project: value.project, role, targets }
}

export const parseEnvelopeClosure = (value: unknown): WorkloadEnvelopeClosure => {
	const json = parseJsonScalar(value, 'envelopeClosure')
	if (!Array.isArray(json)) {
		return { unrecognized: json }
	}
	const entries: WorkloadEnvelopeClosureEntry[] = []
	for (const item of json) {
		const entry = parseClosureEntry(item)
		if (entry === undefined) {
			return { unrecognized: json }
		}
		entries.push(entry)
	}
	return { entries }
}
