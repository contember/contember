import type { TenantClient } from './TenantClient'
import type { S3Manager } from './S3Manager'

interface Project {
	slug: string
	name: string
}

export class ProjectListProvider {
	constructor(
		private tenant: TenantClient,
		private s3: S3Manager,
	) {
	}

	async get(projectGroup: string | undefined, token: string | null): Promise<Project[] | null> {
		if (token === null) {
			return null
		}

		const [accessible, withAdmin] = await Promise.all([
			this.tenant.listAccessibleProjects(token, projectGroup),
			this.s3.listProjectSlugs({ projectGroup }),
		])

		return accessible?.filter(it => withAdmin.includes(it.slug)) ?? null
	}
}
