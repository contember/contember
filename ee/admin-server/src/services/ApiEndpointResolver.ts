import { ProjectGroupResolver } from './ProjectGroupResolver'

export class ApiEndpointResolver {
	constructor(
		private readonly apiEndpoint: string,
		private readonly apiHostname?: string,
	) {
	}

	public resolve(projectGroup: string | undefined): { endpoint: URL, hostname: string } {
		if (projectGroup === undefined) {
			const endpoint = new URL(this.apiEndpoint)
			return { endpoint, hostname: endpoint.hostname }
		}

		const endpoint = new URL(this.apiEndpoint.replace(ProjectGroupResolver.GROUP_PLACEHOLDER, projectGroup))
		const hostname = this.apiHostname ? this.apiHostname.replace(ProjectGroupResolver.GROUP_PLACEHOLDER, projectGroup) : endpoint.hostname
		return { endpoint, hostname }
	}
}
