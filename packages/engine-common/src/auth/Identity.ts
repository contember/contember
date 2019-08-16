interface Identity {
	readonly id: string

	readonly roles: string[]

	getProjectRoles(projectSlug: string): Promise<string[]>
}

namespace Identity {
	export const enum SystemRole {
		SUPER_ADMIN = 'super_admin',
		LOGIN = 'login',
		SETUP = 'setup',
		SELF = 'self',
		PERSON = 'person',
	}

	export class StaticIdentity implements Identity {
		constructor(
			public readonly id: string,
			public readonly roles: string[],
			private readonly projectRoles: { [projectSlug: string]: string[] },
		) {}

		getProjectRoles(projectSlug: string): Promise<string[]> {
			return Promise.resolve(this.projectRoles[projectSlug] || [])
		}
	}
}

export { Identity }
