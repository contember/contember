import { KoaMiddleware } from '../koa'
import { AuthMiddlewareState, ErrorFactory } from '../common'
import { ProjectGroupContainer, ProjectGroupContainerResolver } from '../ProjectGroupContainer'

export interface ProjectGroupState {
	projectGroupContainer: ProjectGroupContainer
}

type InputKoaState =
	& AuthMiddlewareState

type KoaState =
	& InputKoaState
	& ProjectGroupState

export class ProjectGroupMiddlewareFactory {
	constructor(
		private projectGroupDomainMapping: string | undefined,
		private projectGroupContainerResolver: ProjectGroupContainerResolver,
		private readonly errorFactory: ErrorFactory,
	) {
	}

	create(): KoaMiddleware<KoaState> {
		const groupRegex = (
			this.projectGroupDomainMapping
				? new RegExp(
					this.projectGroupDomainMapping.includes('{group}')
						? regexpQuote(this.projectGroupDomainMapping).replace(regexpQuote('{group}'), '([^.]+)')
						: this.projectGroupDomainMapping,
				)
				: undefined
		)
		const projectGroup: KoaMiddleware<KoaState> = async (ctx, next) => {
			let group: string | undefined = undefined
			if (groupRegex) {
				const match = ctx.request.host.match(groupRegex)
				if (!match) {
					return this.errorFactory.createError(ctx, 'Project group not found', 404)
				}
				group = match[1]
			}
			ctx.state.projectGroupContainer = await this.projectGroupContainerResolver.getProjectGroupContainer(group, {})
			return next()
		}
		return projectGroup
	}
}

const regexpQuote = (regexp: string) => regexp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
