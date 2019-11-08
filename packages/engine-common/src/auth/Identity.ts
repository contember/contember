interface Identity {
	readonly id: string

	readonly roles: string[]

	getProjectRoles(projectSlug: string): Promise<string[]>
}

namespace Identity {
	export enum ProjectRole {
		ADMIN = 'admin',
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
