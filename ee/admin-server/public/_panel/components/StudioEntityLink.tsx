import { Link, LinkComponent } from '@contember/admin'

export const createStudioLinkComponent = (project: string): LinkComponent => ({ action, Component, children, entityId, entityName }) => (
	<Link
		to={`${action === 'edit' ? 'studioForm' : 'studioGrid'}(project: $project, entity: $entityName, id: $entityId)`}
		parameters={{ project, entityId, entityName }} Component={Component}>
		{children}
	</Link>
)
