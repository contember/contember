import { useIdentity } from '@contember/react-client-tenant'
import { useCurrentRequest, useRedirect } from '@contember/react-routing'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@contember/react-ui-lib-base'
import { panelRegistry } from '../modules/index.js'
import { useProjectEntryTarget } from './navigation.js'
import { useAvailableModulesResolver } from './modules.js'

/**
 * `me { projects }` only returns projects the identity belongs to, so the switcher is
 * self-filtering — no extra permission probe.
 */
export const ProjectSwitcher = ({ projectSlug }: { projectSlug: string | undefined }) => {
	const identity = useIdentity()
	const request = useCurrentRequest()
	const redirect = useRedirect()
	const projectEntryTarget = useProjectEntryTarget()
	const availableModules = useAvailableModulesResolver()
	const projects = identity?.projects ?? []

	if (projects.length === 0) {
		return null
	}

	const onValueChange = (slug: string) => {
		// Staying on the same module across a project switch is the least surprising behaviour.
		const currentPage = request === null ? undefined : panelRegistry.pages.get(request.pageName)
		if (
			currentPage !== undefined
			&& currentPage.module.scope === 'project'
			&& availableModules(slug).includes(currentPage.module)
		) {
			redirect({ pageName: panelRegistry.entryPageOf(currentPage.module), parameters: { project: slug } })
			return
		}
		redirect(projectEntryTarget(slug))
	}

	return (
		<Select value={projectSlug} onValueChange={onValueChange}>
			<SelectTrigger>
				<SelectValue placeholder="Select project" />
			</SelectTrigger>
			<SelectContent>
				{projects.map(project => <SelectItem key={project.slug} value={project.slug}>{project.name}</SelectItem>)}
			</SelectContent>
		</Select>
	)
}
