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
import { NON_DELEGABLE_TENANT_ROLES, ROLE_SLUG_PATTERN, TenantRole } from './Roles.js'
import { CustomRoleRow } from '../type/CustomRole.js'
import { MailType, mailTypeFromDbToSchema } from '../mailing/type.js'

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

type CanonicalRoleConstraint = {
	readonly allowed: readonly string[]
}

const PROJECT_SLUG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/

/** Derived, so a new mail type never has to be mirrored here. */
const MAIL_TYPES: ReadonlySet<string> = new Set(Object.values(MailType).map(mailTypeFromDbToSchema))

export const BUILTIN_TENANT_ROLES: ReadonlySet<string> = new Set(Object.values(TenantRole))

export const GLOBALLY_ASSIGNABLE_BUILTIN_ROLES: ReadonlySet<string> = new Set([
	TenantRole.LOGIN,
	TenantRole.PERSON,
	TenantRole.SUPER_ADMIN,
	TenantRole.PROJECT_CREATOR,
	TenantRole.PROJECT_ADMIN,
	TenantRole.ENTRYPOINT_DEPLOYER,
])

const RoleConstraintSchema = Typesafe.noExtraProps(Typesafe.object({
	allowed: Typesafe.array(Typesafe.string),
}))

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

const canonicalizeRoleConstraint = (constraint: { readonly allowed: readonly string[] }, path: PropertyKey[]): CanonicalRoleConstraint => {
	const allowed = canonicalizeStrings(constraint.allowed, [...path, 'allowed'], role => ROLE_SLUG_PATTERN.test(role), 'tenant role slug')
	const forbidden = allowed.find(role => NON_DELEGABLE_TENANT_ROLES.has(role))
	if (forbidden !== undefined) {
		throw new Typesafe.ParseError([...path, 'allowed'], `role ${forbidden} is protected and cannot be delegated`)
	}
	return { allowed }
}

const canonicalizeProjects = (projects: readonly string[], path: PropertyKey[]): string[] =>
	canonicalizeStrings(projects, path, project => PROJECT_SLUG_PATTERN.test(project), 'project slug')

const canonicalizeMailTypes = (types: readonly string[], path: PropertyKey[]): string[] =>
	canonicalizeStrings(types, path, type => MAIL_TYPES.has(type), 'mail template type')

const createCanonicalTarget = (target: TargetSelector, path: PropertyKey[]) => ({
	globalRoles: canonicalizeRoleConstraint(target.globalRoles, [...path, 'globalRoles']),
	projectMemberships: target.projectMemberships,
})

const getReferencedRoles = (...constraints: readonly CanonicalRoleConstraint[]): string[] =>
	[...new Set(constraints.flatMap(constraint => constraint.allowed))].sort()

/**
 * The protected-role check is redundant with `allowed` for anything written through
 * `canonicalizeRoleConstraint`, and kept as a fail-closed backstop for rows persisted
 * before a role became protected.
 */
const matchesRoles = (
	observed: readonly string[],
	config: CanonicalRoleConstraint,
): boolean => observed.every(role => config.allowed.includes(role) && !NON_DELEGABLE_TENANT_ROLES.has(role))

const matchesTarget = (
	target: TargetIdentityPermissionTarget,
	config: {
		readonly globalRoles: CanonicalRoleConstraint
		readonly projectMemberships: 'none' | 'any'
	},
): boolean =>
	matchesRoles(target.globalRoles, config.globalRoles)
	&& (config.projectMemberships === 'any' || !target.hasProjectMemberships)

const noConfigDefinition = (name: string, action: Authorizator.Action): CustomRolePermissionDefinition => ({
	name,
	configurationKind: 'NONE',
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
	defaultConfig: null,
	decode: (raw, path) => {
		const config = RoleInputConfigSchema(raw, path)
		const roles = canonicalizeRoleConstraint(config.roles, [...path, 'roles'])
		return {
			canonicalConfig: { roles },
			referencedRoles: getReferencedRoles(roles),
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
	defaultConfig: null,
	decode: (raw, path) => {
		const config = TargetIdentityConfigSchema(raw, path)
		const target = createCanonicalTarget(config.target, [...path, 'target'])
		return {
			canonicalConfig: { target },
			referencedRoles: getReferencedRoles(target.globalRoles),
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
	defaultConfig: null,
	decode: (raw, path) => {
		const config = RoleMutationConfigSchema(raw, path)
		const roles = canonicalizeRoleConstraint(config.roles, [...path, 'roles'])
		const target = createCanonicalTarget(config.target, [...path, 'target'])
		const allowSelf = config.allowSelf
		return {
			canonicalConfig: { roles, target, allowSelf },
			referencedRoles: getReferencedRoles(roles, target.globalRoles),
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
	defaultConfig: null,
	decode: (raw, path) => {
		const config = GlobalApiKeyConfigSchema(raw, path)
		const roles = canonicalizeRoleConstraint(config.roles, [...path, 'roles'])
		const allowTrustForwardedClientInfo = config.allowTrustForwardedClientInfo
		return {
			canonicalConfig: { roles, allowTrustForwardedClientInfo },
			referencedRoles: getReferencedRoles(roles),
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
			referencedRoles: getReferencedRoles(target.globalRoles),
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
			referencedRoles: getReferencedRoles(target.globalRoles),
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
	action: (meta?: MailTemplatePermissionMeta) => Authorizator.Action<MailTemplatePermissionMeta | undefined>,
): CustomRolePermissionDefinition => ({
	name,
	configurationKind: 'MAIL_TEMPLATE_SCOPE',
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
				permissions.allow(role, action(), meta => {
					if (meta === undefined || !types.includes(meta.type)) {
						return false
					}
					return meta.kind === 'global' ? global : meta.projectSlug !== null && projects.includes(meta.projectSlug)
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
	noConfigDefinition('entrypoint:deployEntrypoint', PermissionActions.ENTRYPOINT_DEPLOY),
	noConfigDefinition('apiKey:list', PermissionActions.API_KEY_LIST),
	noConfigDefinition('idp:disable', PermissionActions.IDP_DISABLE),
	noConfigDefinition('idp:enable', PermissionActions.IDP_ENABLE),
	noConfigDefinition('idp:list', PermissionActions.IDP_LIST),
	noConfigDefinition('customRole:view', PermissionActions.CUSTOM_ROLE_VIEW),
	// Exposes role *names* only. Without it a role holding `identity:addGlobalRoles` reads
	// `Identity.roles` as null — it could mutate a role set it was unable to look at first.
	noConfigDefinition('identity:viewPermissions', PermissionActions.IDENTITY_VIEW_PERMISSIONS),
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

const decodeCustomRoleGrants = (
	raw: unknown,
): { readonly permission: string; readonly definition: CustomRolePermissionDefinition; readonly grant: DecodedGrant }[] => {
	if (!Array.isArray(raw)) {
		throw new CustomRoleGrantValidationError('INVALID_PERMISSION_CONFIGURATION', 'Custom role grants must be an array')
	}
	const decoded: { readonly permission: string; readonly definition: CustomRolePermissionDefinition; readonly grant: DecodedGrant }[] = []
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
				definition,
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
	return decoded
}

export const parseCustomRoleGrants = (raw: unknown): ParsedCustomRoleGrants => {
	const decoded = decodeCustomRoleGrants(raw)
	return {
		grants: decoded.map(item => ({ permission: item.permission, config: item.grant.canonicalConfig })),
		referencedRoles: [...new Set(decoded.flatMap(item => item.grant.referencedRoles))].sort(),
		referencedProjects: [...new Set(decoded.flatMap(item => item.grant.referencedProjects))].sort(),
	}
}

/** A persisted role with any invalid grant is entirely inert, never partially applied. */
const decodePersistedGrants = (raw: unknown): ReturnType<typeof decodeCustomRoleGrants> => {
	try {
		return decodeCustomRoleGrants(raw)
	} catch {
		return []
	}
}

/** Fail-closed view of a persisted row, shared by evaluation and by the read API. */
export const parsePersistedCustomRoleGrants = (raw: unknown): readonly CanonicalCustomRoleGrant[] =>
	decodePersistedGrants(raw).map(item => ({ permission: item.permission, config: item.grant.canonicalConfig }))

/** Role slugs a persisted row's configuration names. An undecodable row is wholly inert, so it references nothing. */
export const parsePersistedCustomRoleReferences = (raw: unknown): readonly string[] =>
	[...new Set(decodePersistedGrants(raw).flatMap(item => item.grant.referencedRoles))].sort()

/**
 * Configuration kinds that carry their own exact project filter (`mailTemplate:*` matches project
 * slugs verbatim), so they can answer a project-scoped check on their own terms. Every other kind
 * is bounded only by being tenant-global, and `CustomRoleAuthorizator` drops the scope — so letting
 * one satisfy a scoped check would grant it on *every* project. New kinds default to the safe side.
 */
const PROJECT_BOUNDED_KINDS: ReadonlySet<CustomRoleConfigurationKind> = new Set<CustomRoleConfigurationKind>(['MAIL_TEMPLATE_SCOPE'])

export const buildCustomRolePermissions = (
	rows: readonly CustomRoleRow[],
	{ projectScoped = false }: { readonly projectScoped?: boolean } = {},
): Permissions => {
	const permissions = new Permissions()
	for (const row of rows) {
		for (const item of decodePersistedGrants(row.grants)) {
			if (projectScoped && !PROJECT_BOUNDED_KINDS.has(item.definition.configurationKind)) {
				continue
			}
			item.grant.install(permissions, row.slug)
		}
	}
	return permissions
}

/** Every kind but `NONE` carries a required config object; there is nothing else to store. */
export const isConfigurationRequired = (definition: CustomRolePermissionDefinition): boolean => definition.configurationKind !== 'NONE'
