export interface Identity {
	readonly id: string
	readonly roles: readonly string[]
	readonly person?: Person
	readonly projects: IdentityProject[]
	readonly permissions: {
		readonly canCreateProject: boolean
	}
}

export interface Person {
	readonly id: string
	readonly email?: string
	readonly otpEnabled: boolean
}

export interface IdentityProject {
	readonly slug: string
	readonly name: string
	readonly roles: readonly string[]
}
