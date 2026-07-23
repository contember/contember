import { Authorizator, Permissions } from '@contember/authorization'
import * as Typesafe from '@contember/typesafe'
import {
	GlobalApiKeyPermissionMeta,
	GlobalRoleMutationPermissionMeta,
	MailTemplatePermissionMeta,
	PermissionActions,
	ProfileField,
	TargetIdentityPermissionMeta,
	TargetIdentityPermissionTarget,
} from './PermissionActions.js'
import { TenantRole } from './Roles.js'
import { CustomRoleRow } from '../type/CustomRole.js'

export type CustomRoleConfigurationKind =
	| 'NONE'
	| 'ROLE_INPUT'
	| 'TARGET_IDENTITY'
	| 'ROLE_MUTATION'
	| 'GLOBAL_API_KEY'
	| 'CHANGE_PROFILE'
	| 'CREATE_SESSION_TOKEN'
	| 'MAIL_TEMPLATE_SCOPE'

export type CustomRolePermissionDefinition = {
	readonly name: string
	readonly configurationKind: CustomRoleConfigurationKind
	readonly configurationRequired: boolean
	readonly defaultConfig: Typesafe.Json
	readonly decode: (raw: Typesafe.Json, path: PropertyKey[]) => DecodedGrant
}

export type CanonicalCustomRoleGrant = {
	readonly permission: string
	readonly config: Typesafe.Json
}

export type ParsedCustomRoleGrants = {
	readonly grants: readonly CanonicalCustomRoleGrant[]
	readonly referencedRoles: readonly string[]
	readonly referencedProjects: readonly string[]
}

type DecodedGrant = {
	readonly canonicalConfig: Typesafe.Json
	readonly referencedRoles: readonly string[]
	readonly referencedProjects: readonly string[]
	readonly install: (permissions: Permissions, role: string) => void
}

type RoleInputMeta = {
	readonly requestedRoles?: readonly string[]
}

type TargetSelector = ReturnType<typeof TargetSelectorSchema>

const ROLE_SLUG_PATTERN = /^[a-z][a-z0-9_]*$/
const PROJECT_SLUG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/

const IMMUTABLE_DENIED_ROLES: ReadonlySet<string> = new Set([
	TenantRole.SUPER_ADMIN,
	TenantRole.PROJECT_CREATOR,
])

const MAIL_TYPES: ReadonlySet<string> = new Set([
	'EXISTING_USER_INVITED',
	'NEW_USER_INVITED',
	'RESET_PASSWORD_REQUEST',
	'PASSWORDLESS_SIGN_IN',
	'FORCED_SIGN_OUT',
	'EMAIL_OTP',
	'BACKUP_CODES_EXHAUSTED',
	'EMAIL_VERIFICATION',
	'EMAIL_CHANGE_VERIFY',
	'EMAIL_CHANGE_NOTIFY',
	'UNUSUAL_LOGIN',
])

export const BUILTIN_TENANT_ROLES: ReadonlySet<string> = new Set(Object.values(TenantRole))

export const GLOBALLY_ASSIGNABLE_BUILTIN_ROLES: ReadonlySet<string> = new Set([
	TenantRole.LOGIN,
	TenantRole.PERSON,
	TenantRole.SUPER_ADMIN,
	TenantRole.PROJECT_CREATOR,
	TenantRole.PROJECT_ADMIN,
	TenantRole.ENTRYPOINT_DEPLOYER,
])

const RoleConstraintSchema = Typesafe.noExtraProps(Typesafe.intersection(
	Typesafe.object({
		allowed: Typesafe.array(Typesafe.string),
	}),
	Typesafe.partial({
		denied: Typesafe.array(Typesafe.string),
	}),
))

const TargetSelectorSchema = Typesafe.noExtraProps(Typesafe.object({
	globalRoles: RoleConstraintSchema,
	projectMemberships: Typesafe.enumeration('none', 'any'),
}))

const RoleInputConfigSchema = Typesafe.noExtraProps(Typesafe.object({
	roles: RoleConstraintSchema,
}))

const TargetIdentityConfigSchema = Typesafe.noExtraProps(Typesafe.object({
	target: TargetSelectorSchema,
}))

const RoleMutationConfigSchema = Typesafe.noExtraProps(Typesafe.object({
	roles: RoleConstraintSchema,
	target: TargetSelectorSchema,
	allowSelf: Typesafe.boolean,
}))

const GlobalApiKeyConfigSchema = Typesafe.noExtraProps(Typesafe.object({
	roles: RoleConstraintSchema,
	allowTrustForwardedClientInfo: Typesafe.boolean,
}))

const ChangeProfileConfigSchema = Typesafe.noExtraProps(Typesafe.object({
	target: TargetSelectorSchema,
	fields: Typesafe.noExtraProps(Typesafe.object({
		allowed: Typesafe.array(Typesafe.enumeration('name', 'email')),
	})),
}))

const CreateSessionTokenConfigSchema = Typesafe.noExtraProps(Typesafe.object({
	target: TargetSelectorSchema,
	session: Typesafe.noExtraProps(Typesafe.object({
		maxExpirationMinutes: Typesafe.integer,
		allowTrustForwardedClientInfo: Typesafe.boolean,
	})),
}))

const MailTemplateScopeConfigSchema = Typesafe.noExtraProps(Typesafe.object({
	global: Typesafe.boolean,
	projects: Typesafe.array(Typesafe.string),
	types: Typesafe.array(Typesafe.string),
}))

const canonicalizeStrings = (
	values: readonly string[],
	path: PropertyKey[],
	validate: (value: string) => boolean,
	label: string,
): string[] => {
	for (let index = 0; index < values.length; index++) {
		if (!validate(values[index])) {
			throw new Typesafe.ParseError([...path, index], `must be a valid ${label}`)
		}
	}
	return [...new Set(values)].sort()
}

const canonicalizeAllowedRoles = (roles: readonly string[], path: PropertyKey[]): string[] => {
	const canonical = canonicalizeStrings(roles, path, role => ROLE_SLUG_PATTERN.test(role), 'tenant role slug')
	const forbidden = canonical.find(role => IMMUTABLE_DENIED_ROLES.has(role))
	if (forbidden !== undefined) {
		throw new Typesafe.ParseError(path, `role ${forbidden} is protected and cannot be delegated`)
	}
	return canonical
}

const canonicalizeDeniedRoles = (roles: readonly string[] | undefined, path: PropertyKey[]): string[] =>
	canonicalizeStrings(roles ?? [], path, role => ROLE_SLUG_PATTERN.test(role), 'tenant role slug')

const canonicalizeProjects = (projects: readonly string[], path: PropertyKey[]): string[] =>
	canonicalizeStrings(projects, path, project => PROJECT_SLUG_PATTERN.test(project), 'project slug')

const canonicalizeMailTypes = (types: readonly string[], path: PropertyKey[]): string[] =>
	canonicalizeStrings(types, path, type => MAIL_TYPES.has(type), 'mail template type')

const createCanonicalTarget = (target: TargetSelector, path: PropertyKey[]) => {
	const allowed = canonicalizeAllowedRoles(target.globalRoles.allowed, [...path, 'globalRoles', 'allowed'])
	const denied = canonicalizeDeniedRoles(target.globalRoles.denied, [...path, 'globalRoles', 'denied'])
	return {
		globalRoles: { allowed, denied },
		projectMemberships: target.projectMemberships,
	}
}

const matchesRoles = (
	observed: readonly string[],
	config: { readonly allowed: readonly string[]; readonly denied: readonly string[] },
): boolean => {
	const effectiveDenied = new Set([...IMMUTABLE_DENIED_ROLES, ...config.denied])
	return observed.every(role => config.allowed.includes(role) && !effectiveDenied.has(role))
}

const matchesTarget = (
	target: TargetIdentityPermissionTarget,
	config: {
		readonly globalRoles: { readonly allowed: readonly string[]; readonly denied: readonly string[] }
		readonly projectMemberships: 'none' | 'any'
	},
): boolean =>
	matchesRoles(target.globalRoles, config.globalRoles)
	&& (config.projectMemberships === 'any' || !target.hasProjectMemberships)

const noConfigDefinition = (name: string, action: Authorizator.Action): CustomRolePermissionDefinition => ({
	name,
	configurationKind: 'NONE',
	configurationRequired: false,
	defaultConfig: null,
	decode: (raw, path) => {
		if (raw !== null) {
			throw new Typesafe.ParseError(path, 'configuration is not supported for this permission')
		}
		return {
			canonicalConfig: null,
			referencedRoles: [],
			referencedProjects: [],
			install: (permissions, role) => permissions.allow(role, action),
		}
	},
})

const roleInputDefinition = (
	name: string,
	action: (requestedRoles?: readonly string[]) => Authorizator.Action<RoleInputMeta>,
): CustomRolePermissionDefinition => ({
	name,
	configurationKind: 'ROLE_INPUT',
	configurationRequired: true,
	defaultConfig: null,
	decode: (raw, path) => {
		const config = RoleInputConfigSchema(raw, path)
		const allowed = canonicalizeAllowedRoles(config.roles.allowed, [...path, 'roles', 'allowed'])
		const denied = canonicalizeDeniedRoles(config.roles.denied, [...path, 'roles', 'denied'])
		const roles = { allowed, denied }
		return {
			canonicalConfig: { roles },
			referencedRoles: allowed,
			referencedProjects: [],
			install: (permissions, role) => permissions.allow(role, action(), meta => meta !== undefined && matchesRoles(meta.requestedRoles ?? [], roles)),
		}
	},
})

const targetIdentityDefinition = (
	name: string,
	action: (target: TargetIdentityPermissionTarget | null) => Authorizator.Action<TargetIdentityPermissionMeta>,
): CustomRolePermissionDefinition => ({
	name,
	configurationKind: 'TARGET_IDENTITY',
	configurationRequired: true,
	defaultConfig: null,
	decode: (raw, path) => {
		const config = TargetIdentityConfigSchema(raw, path)
		const target = createCanonicalTarget(config.target, [...path, 'target'])
		return {
			canonicalConfig: { target },
			referencedRoles: target.globalRoles.allowed,
			referencedProjects: [],
			install: (permissions, role) =>
				permissions.allow(role, action(null), meta => meta !== undefined && (meta.target === null || matchesTarget(meta.target, target))),
		}
	},
})

const roleMutationDefinition = (
	name: string,
	action: (meta?: GlobalRoleMutationPermissionMeta) => Authorizator.Action<GlobalRoleMutationPermissionMeta | undefined>,
): CustomRolePermissionDefinition => ({
	name,
	configurationKind: 'ROLE_MUTATION',
	configurationRequired: true,
	defaultConfig: null,
	decode: (raw, path) => {
		const config = RoleMutationConfigSchema(raw, path)
		const allowed = canonicalizeAllowedRoles(config.roles.allowed, [...path, 'roles', 'allowed'])
		const denied = canonicalizeDeniedRoles(config.roles.denied, [...path, 'roles', 'denied'])
		const roles = { allowed, denied }
		const target = createCanonicalTarget(config.target, [...path, 'target'])
		const allowSelf = config.allowSelf
		return {
			canonicalConfig: { roles, target, allowSelf },
			referencedRoles: [...new Set([...allowed, ...target.globalRoles.allowed])].sort(),
			referencedProjects: [],
			install: (permissions, role) =>
				permissions.allow(
					role,
					action(),
					meta =>
						meta === undefined
						|| ((allowSelf || !meta.self)
							&& matchesRoles(meta.requestedRoles, roles)
							&& matchesTarget(meta.target, target)),
				),
		}
	},
})

const globalApiKeyDefinition = (): CustomRolePermissionDefinition => ({
	name: 'apiKey:createGlobal',
	configurationKind: 'GLOBAL_API_KEY',
	configurationRequired: true,
	defaultConfig: null,
	decode: (raw, path) => {
		const config = GlobalApiKeyConfigSchema(raw, path)
		const allowed = canonicalizeAllowedRoles(config.roles.allowed, [...path, 'roles', 'allowed'])
		const denied = canonicalizeDeniedRoles(config.roles.denied, [...path, 'roles', 'denied'])
		const roles = { allowed, denied }
		const allowTrustForwardedClientInfo = config.allowTrustForwardedClientInfo
		return {
			canonicalConfig: { roles, allowTrustForwardedClientInfo },
			referencedRoles: allowed,
			referencedProjects: [],
			install: (permissions, role) =>
				permissions.allow(
					role,
					PermissionActions.API_KEY_CREATE_GLOBAL(),
					meta =>
						meta !== undefined
						&& (!meta.trustForwardedClientInfo || allowTrustForwardedClientInfo)
						&& matchesRoles(meta.requestedRoles, roles),
				),
		}
	},
})

const changeProfileDefinition = (): CustomRolePermissionDefinition => ({
	name: 'person:changeProfile',
	configurationKind: 'CHANGE_PROFILE',
	configurationRequired: true,
	defaultConfig: null,
	decode: (raw, path) => {
		const config = ChangeProfileConfigSchema(raw, path)
		const target = createCanonicalTarget(config.target, [...path, 'target'])
		const fields: ProfileField[] = [...new Set(config.fields.allowed)].sort()
		if (fields.length === 0) {
			throw new Typesafe.ParseError([...path, 'fields', 'allowed'], 'must contain at least one field')
		}
		return {
			canonicalConfig: { target, fields: { allowed: fields } },
			referencedRoles: target.globalRoles.allowed,
			referencedProjects: [],
			install: (permissions, role) =>
				permissions.allow(
					role,
					PermissionActions.PERSON_CHANGE_PROFILE(null, []),
					meta =>
						meta !== undefined
						&& (meta.target === null || matchesTarget(meta.target, target))
						&& meta.fields.every(field => fields.includes(field)),
				),
		}
	},
})

const createSessionTokenDefinition = (): CustomRolePermissionDefinition => ({
	name: 'person:createSessionToken',
	configurationKind: 'CREATE_SESSION_TOKEN',
	configurationRequired: true,
	defaultConfig: null,
	decode: (raw, path) => {
		const config = CreateSessionTokenConfigSchema(raw, path)
		const target = createCanonicalTarget(config.target, [...path, 'target'])
		const maxExpirationMinutes = config.session.maxExpirationMinutes
		if (maxExpirationMinutes <= 0) {
			throw new Typesafe.ParseError([...path, 'session', 'maxExpirationMinutes'], 'must be greater than zero')
		}
		const allowTrustForwardedClientInfo = config.session.allowTrustForwardedClientInfo
		return {
			canonicalConfig: {
				target,
				session: { maxExpirationMinutes, allowTrustForwardedClientInfo },
			},
			referencedRoles: target.globalRoles.allowed,
			referencedProjects: [],
			install: (permissions, role) =>
				permissions.allow(role, PermissionActions.PERSON_CREATE_SESSION_KEY({ phase: 'preflight' }), meta => {
					if (meta.phase === 'preflight') {
						return true
					}
					return meta.target !== undefined
						&& matchesTarget(meta.target, target)
						&& (!meta.trustForwardedClientInfo || allowTrustForwardedClientInfo)
						&& meta.requestedExpirationMinutes !== null
						&& meta.requestedExpirationMinutes !== undefined
						&& meta.requestedExpirationMinutes > 0
						&& meta.requestedExpirationMinutes <= maxExpirationMinutes
				}),
		}
	},
})

const mailTemplateDefinition = (
	name: string,
	action: (meta: MailTemplatePermissionMeta) => Authorizator.Action<MailTemplatePermissionMeta>,
): CustomRolePermissionDefinition => ({
	name,
	configurationKind: 'MAIL_TEMPLATE_SCOPE',
	configurationRequired: true,
	defaultConfig: null,
	decode: (raw, path) => {
		const config = MailTemplateScopeConfigSchema(raw, path)
		const projects = canonicalizeProjects(config.projects, [...path, 'projects'])
		const types = canonicalizeMailTypes(config.types, [...path, 'types'])
		if (!config.global && projects.length === 0) {
			throw new Typesafe.ParseError(path, 'must grant global or at least one project scope')
		}
		if (types.length === 0) {
			throw new Typesafe.ParseError([...path, 'types'], 'must contain at least one mail template type')
		}
		const global = config.global
		return {
			canonicalConfig: { global, projects, types },
			referencedRoles: [],
			referencedProjects: projects,
			install: (permissions, role) =>
				permissions.allow(role, action({ kind: 'any' }), meta => {
					if (meta.kind === 'any') {
						return global || projects.length > 0
					}
					if (meta.type === undefined || !types.includes(meta.type)) {
						return false
					}
					return meta.kind === 'global'
						? global
						: meta.projectSlug !== null && meta.projectSlug !== undefined && projects.includes(meta.projectSlug)
				}),
		}
	},
})

const definitions: readonly CustomRolePermissionDefinition[] = [
	noConfigDefinition('system:configure', PermissionActions.CONFIGURE),
	noConfigDefinition('system:viewConfig', PermissionActions.CONFIG_VIEW),
	noConfigDefinition('system:viewAuthLog', PermissionActions.AUTH_LOG_VIEW),
	noConfigDefinition('person:view', PermissionActions.PERSON_VIEW),
	noConfigDefinition('person:list', PermissionActions.PERSON_LIST),
	noConfigDefinition('project:create', PermissionActions.PROJECT_CREATE),
	noConfigDefinition('entrypoint:deployEntrypoint', PermissionActions.ENTRYPOINT_DEPLOY),
	noConfigDefinition('apiKey:list', PermissionActions.API_KEY_LIST),
	noConfigDefinition('idp:disable', PermissionActions.IDP_DISABLE),
	noConfigDefinition('idp:enable', PermissionActions.IDP_ENABLE),
	noConfigDefinition('idp:list', PermissionActions.IDP_LIST),
	noConfigDefinition('customRole:view', PermissionActions.CUSTOM_ROLE_VIEW),
	roleInputDefinition('person:signUp', PermissionActions.PERSON_SIGN_UP),
	targetIdentityDefinition('person:disable', PermissionActions.PERSON_DISABLE),
	targetIdentityDefinition('person:forceSignOut', PermissionActions.PERSON_FORCE_SIGN_OUT),
	targetIdentityDefinition('person:resetMfa', PermissionActions.PERSON_RESET_MFA),
	targetIdentityDefinition('person:viewSessions', PermissionActions.PERSON_VIEW_SESSIONS),
	targetIdentityDefinition('person:viewIdp', PermissionActions.PERSON_VIEW_IDP),
	targetIdentityDefinition('person:changePassword', PermissionActions.PERSON_CHANGE_PASSWORD),
	changeProfileDefinition(),
	createSessionTokenDefinition(),
	roleMutationDefinition('identity:addGlobalRoles', PermissionActions.IDENTITY_ADD_GLOBAL_ROLES),
	roleMutationDefinition('identity:removeGlobalRoles', PermissionActions.IDENTITY_REMOVE_GLOBAL_ROLES),
	globalApiKeyDefinition(),
	mailTemplateDefinition('mailTemplate:add', PermissionActions.MAIL_TEMPLATE_ADD),
	mailTemplateDefinition('mailTemplate:remove', PermissionActions.MAIL_TEMPLATE_REMOVE),
	mailTemplateDefinition('mailTemplate:list', PermissionActions.MAIL_TEMPLATE_LIST),
]

const catalog: ReadonlyMap<string, CustomRolePermissionDefinition> = new Map(definitions.map(definition => [definition.name, definition]))

export const getGrantablePermissions = (): ReadonlyMap<string, CustomRolePermissionDefinition> => catalog

export type CustomRoleGrantValidationErrorCode =
	| 'UNKNOWN_PERMISSION'
	| 'DUPLICATE_PERMISSION'
	| 'INVALID_PERMISSION_CONFIGURATION'

export class CustomRoleGrantValidationError extends Error {
	constructor(
		public readonly code: CustomRoleGrantValidationErrorCode,
		message: string,
	) {
		super(message)
	}
}

const parseEnvelope = (
	raw: unknown,
	path: PropertyKey[],
): { readonly permission: string; readonly config: Typesafe.Json } => {
	const object = Typesafe.anyJsonObject(raw, path)
	for (const key of Object.keys(object)) {
		if (key !== 'permission' && key !== 'config') {
			throw new Typesafe.ParseError(path, `extra property ${key} found`)
		}
	}
	const permission = Typesafe.string(object.permission, [...path, 'permission'])
	const config = object.config === undefined ? null : Typesafe.anyJson(object.config, [...path, 'config'])
	return { permission, config }
}

export const parseCustomRoleGrants = (raw: unknown): ParsedCustomRoleGrants => {
	if (!Array.isArray(raw)) {
		throw new CustomRoleGrantValidationError('INVALID_PERMISSION_CONFIGURATION', 'Custom role grants must be an array')
	}
	const decoded: { readonly permission: string; readonly grant: DecodedGrant }[] = []
	const seen = new Set<string>()
	for (let index = 0; index < raw.length; index++) {
		let envelope: { readonly permission: string; readonly config: Typesafe.Json }
		try {
			envelope = parseEnvelope(raw[index], [index])
		} catch (error) {
			const message = error instanceof Error ? error.message : 'invalid grant'
			throw new CustomRoleGrantValidationError('INVALID_PERMISSION_CONFIGURATION', `Grant ${index}: ${message}`)
		}
		if (seen.has(envelope.permission)) {
			throw new CustomRoleGrantValidationError('DUPLICATE_PERMISSION', `Permission ${envelope.permission} is present more than once`)
		}
		seen.add(envelope.permission)
		const definition = catalog.get(envelope.permission)
		if (definition === undefined) {
			throw new CustomRoleGrantValidationError(
				'UNKNOWN_PERMISSION',
				`Permission ${envelope.permission} is unknown or not grantable to a custom role`,
			)
		}
		try {
			decoded.push({
				permission: envelope.permission,
				grant: definition.decode(envelope.config, [index, 'config']),
			})
		} catch (error) {
			const message = error instanceof Error ? error.message : 'invalid configuration'
			throw new CustomRoleGrantValidationError(
				'INVALID_PERMISSION_CONFIGURATION',
				`Grant ${envelope.permission}: ${message}`,
			)
		}
	}
	decoded.sort((left, right) => left.permission.localeCompare(right.permission))
	return {
		grants: decoded.map(item => ({ permission: item.permission, config: item.grant.canonicalConfig })),
		referencedRoles: [...new Set(decoded.flatMap(item => item.grant.referencedRoles))].sort(),
		referencedProjects: [...new Set(decoded.flatMap(item => item.grant.referencedProjects))].sort(),
	}
}

const parsePersistedEnvelope = (
	raw: unknown,
	path: PropertyKey[],
): { readonly permission: string; readonly config: Typesafe.Json } | null => {
	try {
		return parseEnvelope(raw, path)
	} catch {
		return null
	}
}

export const buildCustomRolePermissions = (rows: readonly CustomRoleRow[]): Permissions => {
	const permissions = new Permissions()
	for (const row of rows) {
		if (!Array.isArray(row.grants)) {
			continue
		}
		try {
			parseCustomRoleGrants(row.grants)
		} catch {
			// A persisted role with any invalid grant is entirely inert.
			continue
		}
		const envelopes = row.grants.map((raw, index) => parsePersistedEnvelope(raw, [index]))
		const counts = new Map<string, number>()
		for (const envelope of envelopes) {
			if (envelope !== null) {
				counts.set(envelope.permission, (counts.get(envelope.permission) ?? 0) + 1)
			}
		}
		for (const envelope of envelopes) {
			if (envelope === null || counts.get(envelope.permission) !== 1) {
				continue
			}
			const definition = catalog.get(envelope.permission)
			if (definition === undefined) {
				continue
			}
			try {
				definition.decode(envelope.config, ['config']).install(permissions, row.slug)
			} catch {
				// Persisted invalid configuration grants nothing.
			}
		}
	}
	return permissions
}
