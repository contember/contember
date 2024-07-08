import { ApplicationContext, HttpErrorResponse, ProjectConfig, ProjectContainer, ProjectContextResolver } from '@contember/engine-http'
import { Identity } from '../../authorization'

export interface ActionsContext {
	projectContainer: ProjectContainer
	project: ProjectConfig
	identity: Identity
}

export class ActionsContextResolver {
	constructor(
		private readonly debug: boolean,
		private readonly projectContextResolver: ProjectContextResolver,
	) {
	}

	async resolve(ctx: ApplicationContext): Promise<ActionsContext> {
		const { timer, projectGroup: { tenantContainer }, logger, authResult } = ctx
		const projectContext = await this.projectContextResolver.resolve(ctx)
		const { project } = projectContext
		if (!authResult) {
			throw new HttpErrorResponse(401, 'Authentication required')
		}
		const memberships = await timer('MembershipFetch', () =>
			tenantContainer.projectMemberManager.getEffectiveProjectMemberships(
				tenantContainer.databaseContext,
				{ slug: project.slug },
				{
					id: authResult.identityId,
					roles: authResult.roles,
				},
			),
		)
		logger.debug('Memberships fetched', { memberships })

		if (memberships.length === 0) {
			throw this.debug
				? new HttpErrorResponse(404, `You are not allowed to access project ${project.slug}`)
				: new HttpErrorResponse(404, `Project ${project.slug} NOT found`)
		}
		const roles = memberships.map(it => it.role)
		return {
			...projectContext,
			identity: { id: authResult.identityId, roles },
		}
	}
}
