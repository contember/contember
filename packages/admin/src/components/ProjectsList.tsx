import { Button, ButtonList } from '@contember/ui'
import { connect } from 'react-redux'
import { pushRequest } from '../actions/request'
import type { Dispatch } from '../actions/types'
import type State from '../state'
import type { ProjectConfig } from '../state/projectsConfigs'
import type { RequestChange } from '../state/request'
import { Link } from './Link'
import { Component as ReactComponent } from 'react'
import { MiscPageLayout } from './MiscPageLayout'

interface ProjectsListProps {
	configs: ProjectConfig[]
	onSelectProject: (project: ProjectConfig) => void
}

const selectProjectRequest = (project: ProjectConfig): RequestChange => () => ({
	name: 'project_page',
	project: project.project,
	stage: project.stage,
	pageName: 'dashboard',
	parameters: {},
	dimensions: {},
})

class ProjectsList extends ReactComponent<ProjectsListProps, {}> {
	componentDidMount(): void {
		if (this.props.configs.length === 1) {
			this.props.onSelectProject(this.props.configs[0])
		}
	}

	render() {
		return (
			<MiscPageLayout heading="Projects">
				<ButtonList flow="block">
					{this.props.configs.map((config, i) => (
						<Link
							key={i}
							requestChange={selectProjectRequest(config)}
							Component={({ isActive, ...props }) => (
								<Button
									{...props}
									onClick={undefined} /* css reload workaround */
									Component="a"
									distinction="seamless"
									flow="block"
									justification="justifyStart"
								/>
							)}
						>
							{config.project}/{config.stage}
						</Link>
					))}
				</ButtonList>
			</MiscPageLayout>
		)
	}
}

export default connect<
	Pick<ProjectsListProps, 'configs'>,
	Pick<ProjectsListProps, 'onSelectProject'>,
	Pick<ProjectsListProps, 'configs'>,
	State
>(
	(state, ownProps) => {
		const projects = (state.auth.identity ? state.auth.identity.projects : []).map(it => it.slug)
		return {
			configs: ownProps.configs.filter(it => projects.includes(it.project)),
		}
	},
	(dispatch: Dispatch) => ({
		onSelectProject: project => dispatch(pushRequest(selectProjectRequest(project))),
	}),
)(ProjectsList)
