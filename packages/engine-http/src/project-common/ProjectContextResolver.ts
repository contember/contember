import { HttpErrorResponse } from '../common'
import { ApplicationContext } from '../application'


export class ProjectContextResolver {
	async resolve(context: ApplicationContext) {
		const projectSlug = context.params.projectSlug
		const projectContainer = await context.projectGroup.projectContainerResolver.getProjectContainer(projectSlug, { alias: true })

		if (projectContainer === undefined) {
			throw new HttpErrorResponse(404, `Project ${projectSlug} NOT found`)
		}

		const project = projectContainer.project
		return { projectContainer, project }
	}
}
