import { useIdentity } from '@contember/react-client-tenant'
import { Link } from '@contember/react-routing'
import { Card, CardDescription, CardHeader, CardTitle } from '@contember/react-ui-lib-base'
import { useProjectEntryTarget } from '../../shell/navigation.js'
import { PanelSlots } from '../../shell/slots.js'

/** Projects the identity belongs to — `me { projects }` already filters them. */
export const ProjectsPage = () => {
	const projects = useIdentity()?.projects ?? []
	const projectEntryTarget = useProjectEntryTarget()

	return (
		<>
			<PanelSlots.Title>Projects</PanelSlots.Title>
			{projects.length === 0
				? <p className="text-sm text-muted-foreground">This account is not a member of any project.</p>
				: (
					<div className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-4">
						{projects.map(project => (
							<Link key={project.slug} to={projectEntryTarget(project.slug)}>
								<a className="block">
									<Card className="h-full transition-colors hover:bg-accent">
										<CardHeader>
											<CardTitle>{project.name}</CardTitle>
											<CardDescription>{project.slug}</CardDescription>
										</CardHeader>
									</Card>
								</a>
							</Link>
						))}
					</div>
				)}
		</>
	)
}
