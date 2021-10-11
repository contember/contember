import { KoaMiddleware, KoaRequestState } from '../koa'
import { ProjectContainer, ProjectContainerResolver } from '../ProjectContainer'
import { ProjectConfig } from '../ProjectConfig'
import { AuthMiddlewareState, ErrorFactory } from '../common'
import { TenantDatabaseMiddlewareState } from '../tenant'

type InputKoaState =
	& KoaRequestState
	& AuthMiddlewareState
	& TenantDatabaseMiddlewareState

type KoaState =
	& InputKoaState
	& ProjectResolveMiddlewareState

export interface ProjectResolveMiddlewareState {
	project: ProjectConfig
	projectContainer: ProjectContainer
}

export class ProjectResolveMiddlewareFactory {
	constructor(
		private readonly projectContainerResolver: ProjectContainerResolver,
		private readonly errorFactory: ErrorFactory,
	) {
	}

	public create(): KoaMiddleware<KoaState> {
		const projectResolve: KoaMiddleware<KoaState> = async (ctx, next) => {
			const projectSlug = ctx.state.params.projectSlug
			const projectContainer = await this.projectContainerResolver.getProjectContainer(ctx.state.tenantDatabase, projectSlug, true)

			if (projectContainer === undefined) {
				return this.errorFactory.createError(ctx, `Project ${projectSlug} NOT found`, 404)
			}
			ctx.state.projectContainer = projectContainer
			ctx.state.project = projectContainer.project
			await next()
		}
		return projectResolve

	}
}
