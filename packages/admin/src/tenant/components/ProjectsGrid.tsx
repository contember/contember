import { FC } from 'react'
import { useAuthedTenantQuery } from '../hooks'
import { Table, TableCell, TableRow } from '@contember/ui'
import { RoutingLinkTarget } from '../../routing'
import { PageLinkButton } from '../../components'
import { QueryLoader } from './QueryLoader'

interface ProjectGridProps {
	createProjectDetailLink: (project: string) => RoutingLinkTarget
}

export const ProjectsGrid: FC<ProjectGridProps> = ({ createProjectDetailLink }) => {
	const { state: query } = useAuthedTenantQuery<{ projects: { slug: string, name: string }[] }, {}>(`query {
	projects {
		slug
		name
	}
}`, {})

	return <QueryLoader query={query}>
		{({ query }) => <Table>
			{query.data?.projects.map(project => <TableRow>
				<TableCell>{project.name}</TableCell>
				<TableCell><span style={{ fontFamily: 'monospace' }}>{project.slug}</span></TableCell>
				<TableCell>
					<PageLinkButton to={createProjectDetailLink(project.slug)}>Overview and users</PageLinkButton>
				</TableCell>
			</TableRow>)}
		</Table>}
	</QueryLoader>
}
