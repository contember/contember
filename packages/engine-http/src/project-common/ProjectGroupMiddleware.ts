import { ProjectGroup, ProjectGroupProvider } from '@contember/engine-tenant-api'
import { KoaMiddleware } from '../koa'
import { AuthMiddlewareState, ErrorFactory } from '../common'

export interface ProjectGroupState {
	projectGroup: ProjectGroup
}

type InputKoaState =
	& AuthMiddlewareState

type KoaState =
	& InputKoaState
	& ProjectGroupState

export class ProjectGroupMiddlewareFactory {
	constructor(
		private projectGroupDomainMapping: string | undefined,
		private projectGroupProvider: ProjectGroupProvider,
		private readonly errorFactory: ErrorFactory,
	) {
	}

	create(): KoaMiddleware<KoaState> {
		const groupRegex = this.projectGroupDomainMapping ? new RegExp(this.projectGroupDomainMapping) : undefined
		const tenantDatabase: KoaMiddleware<KoaState> = async (ctx, next) => {
			let group: string | undefined = undefined
			if (groupRegex) {
				const match = ctx.request.host.match(groupRegex)
				if (!match) {
					return this.errorFactory.createError(ctx, 'Project group not found', 404)
				}
				group = match[1]
			}
			ctx.state.projectGroup = await this.projectGroupProvider.getGroup(group)
			return next()
		}
		return tenantDatabase
	}
}
