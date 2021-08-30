import { AnchorButton, ButtonList } from '@contember/ui'
import { MiscPageLayout } from '../MiscPageLayout'

export interface Project {
	slug: string
	name: string
}

export interface ProjectListProps {
	projects: Project[],
	formatProjectUrl: (project: Project) => string
}

export const ProjectList = (props: ProjectListProps) => {
	return (
		<MiscPageLayout heading="Projects">
			<ButtonList flow="block">
				{props.projects.map(project => (
					<AnchorButton
						key={project.slug}
						href={props.formatProjectUrl(project)}
						distinction="seamless"
						flow="block"
						justification="justifyStart"
					>
						{project.name}
					</AnchorButton>
				))}
			</ButtonList>
		</MiscPageLayout>
	)
}
