import { FC } from 'react'
import { useAuthedTenantQuery } from '../hooks'
import { ContainerSpinner, Table, TableCell, TableHeaderCell, TableRow } from '@contember/ui'

export const ProjectsGrid: FC = () => {
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
	return <Table tableHead={
		<TableRow><TableHeaderCell>Name</TableHeaderCell><TableHeaderCell>Slug</TableHeaderCell></TableRow>}>
		{query.data?.projects.map(project => <TableRow>
			<TableCell>{project.name}</TableCell>
			<TableCell><span style={{ fontFamily: 'monospace' }}>{project.slug}</span></TableCell>
		</TableRow>)}
	</Table>
}
