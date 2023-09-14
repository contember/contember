import { AnchorButton, ButtonList } from '@contember/ui'
import { EmptyMessage } from '@contember/react-binding-ui'
import { MiscPageLayout } from '../MiscPageLayout'

export interface Project {
	slug: string
	name: string
}

export interface ProjectListProps {
	projects: readonly Project[],
	formatProjectUrl: (project: Project) => string
}

export const ProjectList = (props: ProjectListProps) => {
	return (
		<MiscPageLayout heading="Projects">
			<ProjectListButtons {...props}/>
		</MiscPageLayout>
	)
}

export const ProjectListButtons = (props: ProjectListProps) => {
	if (props.projects.length === 0) {
		return <EmptyMessage>No projects found</EmptyMessage>
	}

	return <ButtonList display="block">
		{props.projects.map(project => (
			<AnchorButton
				key={project.slug}
				href={props.formatProjectUrl(project)}
				distinction="seamless"
				display="block"
				justify="start"
			>
				{project.name}
			</AnchorButton>
		))}
	</ButtonList>
}
