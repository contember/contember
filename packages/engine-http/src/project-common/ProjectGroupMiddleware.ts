import { ProjectGroup, ProjectGroupProvider } from '@contember/engine-tenant-api'
import { KoaMiddleware } from '../koa'

export interface ProjectGroupState {
	projectGroup: ProjectGroup
}

export class ProjectGroupMiddlewareFactory {
	constructor(
		private projectGroupProvider: ProjectGroupProvider,
	) {
	}

	create(): KoaMiddleware<ProjectGroupState> {
		const tenantDatabase: KoaMiddleware<ProjectGroupState> = (ctx, next) => {
			ctx.state.projectGroup = this.projectGroupProvider.getGroup(undefined)
			return next()
		}
		return tenantDatabase
	}
}
