import type { TenantApi } from './tenant'
import type { S3Manager } from './s3'

interface Project {
	slug: string
	name: string
}

export class ProjectListProvider {
	constructor(
		private tenant: TenantApi,
		private s3: S3Manager,
	) {
	}

	async get(token: string | null): Promise<Project[] | null> {
		if (token === null) {
			return null
		}

		const [accessible, withAdmin] = await Promise.all([
			this.tenant.listAccessibleProjects(token),
			this.s3.listProjectSlugs(),
		])

		return accessible?.filter(it => withAdmin.includes(it.slug)) ?? null
	}
}
