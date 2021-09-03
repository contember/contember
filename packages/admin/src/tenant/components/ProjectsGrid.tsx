import { FC } from 'react'
import { useAuthedTenantQuery } from '../hooks'
import { AnchorButton, ContainerSpinner, Table, TableCell, TableHeaderCell, TableRow } from '@contember/ui'
import { RoutingLinkTarget } from '../../routing'
import { PageLinkButton } from '../../components'

interface ProjectGridProps
{
	createProjectDetailLink: (project: string) => RoutingLinkTarget
}

export const ProjectsGrid: FC<ProjectGridProps> = ({ createProjectDetailLink }) => {
	const { state: query } = useAuthedTenantQuery<{ projects: { slug: string, name: string }[] }, {}>(`query {
	projects {
		slug
		name
	}
}`, {})
	if (query.error) {
		return <>Error loading data</>
	}
	if (query.loading) {
		return <ContainerSpinner />
	}
	return <Table>
		{query.data?.projects.map(project => <TableRow>
			<TableCell>{project.name}</TableCell>
			<TableCell><span style={{ fontFamily: 'monospace' }}>{project.slug}</span></TableCell>
			<TableCell>
				<PageLinkButton to={createProjectDetailLink(project.slug)}>Overview and users</PageLinkButton>
			</TableCell>
		</TableRow>)}
	</Table>
}
