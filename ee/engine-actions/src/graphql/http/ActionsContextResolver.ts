import { ApplicationContext, HttpErrorResponse, ProjectContextResolver } from '@contember/engine-http'
import { ProjectRole } from '@contember/schema'

export class ActionsContextResolver {
	constructor(
		private readonly debug: boolean,
		private readonly projectContextResolver: ProjectContextResolver,
	) {
	}

	async resolve(ctx: ApplicationContext) {
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

		const isProjectAdmin = memberships.some(it => it.role === ProjectRole.ADMIN)
		if (!isProjectAdmin) {
			throw this.debug
				? new HttpErrorResponse(404, `You are not allowed to access project ${project.slug}`)
				: new HttpErrorResponse(404, `Project ${project.slug} NOT found`)
		}
		return projectContext
	}
}
