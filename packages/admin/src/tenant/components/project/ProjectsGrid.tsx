import { Table, TableCell, TableHeaderCell, TableRow } from '@contember/ui'
import { FC } from 'react'
import { useAuthedTenantQuery } from '../../lib'
import { LinkButton, RoutingLinkTarget } from '../../../routing'
import { QueryLoader } from '../QueryLoader'

interface ProjectGridProps {
	createProjectDetailLink: (project: string) => RoutingLinkTarget
}

export const ProjectsGrid: FC<ProjectGridProps> = ({ createProjectDetailLink }) => {
	const { state: query } = useAuthedTenantQuery<{ projects: { slug: string, name: string }[] }, {}>(`
		query {
			projects {
				slug
				name
			}
		}`,
		{},
	)

	return (
		<QueryLoader query={query}>
			{({ query }) => (
				<Table
					tableHead={<TableRow>
						<TableHeaderCell>Name</TableHeaderCell>
						<TableHeaderCell>Slug</TableHeaderCell>
						<TableHeaderCell />
					</TableRow>}
				>
					{query.data?.projects.map(project => (
						<TableRow key={project.slug}>
							<TableCell>{project.name}</TableCell>
							<TableCell>
								<span style={{ fontFamily: 'monospace' }}>{project.slug}</span>
							</TableCell>
							<TableCell shrunk>
								<LinkButton to={createProjectDetailLink(project.slug)}>Overview and users</LinkButton>
							</TableCell>
						</TableRow>
					))}
				</Table>
			)}
		</QueryLoader>
	)
}
