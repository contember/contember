/**
 * What the identity may do, as the tenant API reports it (`me { permissions }`).
 *
 * Advisory: it mirrors the ACL the resolvers enforce so a UI can stop offering what it cannot
 * deliver. Never treat a `true` here as authorization — the operation is checked again when called.
 */
export interface IdentityGlobalPermissions {
	readonly canCreateProject: boolean
	readonly canDeployEntrypoint: boolean
	/** Read `configuration`, which throws rather than answering an empty value. */
	readonly canViewConfiguration: boolean
	readonly canListIdentityProviders: boolean
	readonly canListMailTemplates: boolean
	readonly canManageConfiguration: boolean
	readonly canViewAuthLog: boolean
	/** List every person. Without it `persons` still answers, narrowed to the projects the caller administers. */
	readonly canListPersons: boolean
	readonly canListGlobalApiKeys: boolean
	readonly canCreateGlobalApiKey: boolean
}

/** Same contract as {@link IdentityGlobalPermissions}, scoped to one project. */
export interface ProjectPermissions {
	readonly canViewMembers: boolean
	readonly canAddMember: boolean
	readonly canUpdateMember: boolean
	readonly canRemoveMember: boolean
	readonly canViewSecrets: boolean
	/** Distinct from viewing: a project admin commonly has one and not the other. */
	readonly canSetSecret: boolean
	readonly canCreateApiKey: boolean
	readonly canUpdate: boolean
}

export interface Identity {
	readonly id: string
	readonly roles: readonly string[]
	readonly person?: Person
	readonly projects: IdentityProject[]
	readonly permissions: IdentityGlobalPermissions
}

export interface Person {
	readonly id: string
	readonly email?: string
	readonly name?: string
	readonly otpEnabled: boolean
	readonly emailOtpEnabled: boolean
	/** The person's own opt-in; `undefined` means "follow the tenant policy". Says nothing on its own — see `passwordlessAvailable`. */
	readonly passwordlessEnabled?: boolean
	/** Whether passwordless sign-in actually works right now: the tenant policy resolved against `passwordlessEnabled`, as `signIn` resolves it. */
	readonly passwordlessAvailable: boolean
	/** Whether `passwordlessEnabled` is what decides `passwordlessAvailable`. False under an `always`/`never` policy, where a toggle would change nothing. */
	readonly passwordlessSelfManaged: boolean
}

export interface IdentityProject {
	readonly slug: string
	readonly name: string
	readonly roles: readonly string[]
	readonly permissions: ProjectPermissions
}
