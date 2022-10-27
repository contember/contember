import { HttpController } from '../application'
import { HttpErrorResponse } from '../common'
import { Readable } from 'stream'
import { toBuffer } from './CommandStream'
import { ExportExecutor, ExportRequest } from './ExportExecutor'
import { ParseError } from '@contember/typesafe'
import { ProjectGroupResolver } from '../projectGroup/ProjectGroupResolver'
import { ProjectContainer } from '../project'

export class ExportApiControllerFactory {
	constructor(
		private readonly projectGroupResolver: ProjectGroupResolver,
		private readonly exportExecutor: ExportExecutor,
	) {
	}

	create(): HttpController {
		return async ctx => {
			const { timer, projectGroup, authResult, koa } = ctx
			const { request, response } = koa
			if (!authResult) {
				return new HttpErrorResponse(401, 'Authentication required')
			}

			let exportRequest: ExportRequest

			try {
				exportRequest = ExportRequest(request.body)

			} catch (e) {
				if (e instanceof ParseError) {
					return new HttpErrorResponse(400, `Invalid request body: ${e.message}`)
				} else {
					throw e
				}
			}

			const projectContainers: Record<string, ProjectContainer> = {}

			for (const project of exportRequest.projects) {
				const projectContainer = await projectGroup.projectContainerResolver.getProjectContainer(project.slug, { alias: true })

				if (projectContainer === undefined) {
					throw new HttpErrorResponse(400, `Project ${project.slug} NOT found`)
				}

				const systemContext = projectContainer.systemDatabaseContextFactory.create()
				const schema = await projectContainer.contentSchemaResolver.getSchema(systemContext, project.slug)
				const { effective: memberships } = await timer('MembershipFetch', () => projectGroup.projectMembershipResolver.resolveMemberships({
					getHeader: () => '',
					acl: schema.acl,
					projectSlug: project.slug,
					identity: {
						identityId: authResult.identityId,
						roles: authResult.roles,
					},
				}))

				const projectRoles = memberships.map(it => it.role)

				if (!projectRoles.some(role => schema.acl.roles[role]?.content?.export)) {
					throw new HttpErrorResponse(403, `Not allowed`)
				}

				if (project.system && !projectRoles.some(role => schema.acl.roles[role]?.system?.export)) {
					throw new HttpErrorResponse(403, `Not allowed`)
				}

				projectContainers[project.slug] = projectContainer
			}

			response.status = 200
			response.res.setHeader('Content-Type', 'application/x-ndjson') // https://github.com/ndjson/ndjson-spec
			response.body = Readable.from(toBuffer(this.exportExecutor.export(exportRequest, projectContainers)))
		}
	}
}
