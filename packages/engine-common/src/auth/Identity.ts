interface Identity {
	readonly id: string

	readonly roles: string[]

	getProjectRoles(projectId: string): Promise<string[]>
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
			private readonly projectRoles: { [projectId: string]: string[] },
		) {}

		getProjectRoles(projectId: string): Promise<string[]> {
			return Promise.resolve(this.projectRoles[projectId] || [])
		}
	}
}

export { Identity }
