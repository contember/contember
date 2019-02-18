import { Card, H1 } from '@blueprintjs/core'
import * as React from 'react'
import { ProjectConfig } from '../state/projectsConfigs'
import Link from './Link'
import { connect } from 'react-redux'
import State from '../state'
import { pushRequest } from '../actions/request'
import { RequestChange } from '../state/request'
import { Dispatch } from '../actions/types'

interface ProjectsListProps {
	configs: ProjectConfig[]
	onSelectProject: (projet: ProjectConfig) => void
}

const selectProjectRequest = (project: ProjectConfig): RequestChange => () => ({
	name: 'project_page',
	project: project.project,
	stage: project.stage,
	pageName: 'dashboard',
	parameters: {},
	dimensions: {}
})

class ProjectsList extends React.Component<ProjectsListProps, {}> {
	componentDidMount(): void {
		if (this.props.configs.length === 1) {
			this.props.onSelectProject(this.props.configs[0])
		}
	}

	render() {
		return (
			<div className="centerCard-wrap">
				<Card className="centerCard">
					<H1>Projects</H1>
					<div>
						{this.props.configs.map((config, i) => (
							<Link
								key={i}
								requestChange={selectProjectRequest(config)}
								Component={props => (
									<a {...props} className="projectsList-item">
										{config.project}/{config.stage}
									</a>
								)}
							/>
						))}
					</div>
				</Card>
			</div>
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
		const projects = state.auth.identity ? state.auth.identity.projects : []
		return {
			configs: ownProps.configs.filter(it => projects.includes(it.project))
		}
	},
	(dispatch: Dispatch) => ({
		onSelectProject: project => dispatch(pushRequest(selectProjectRequest(project)))
	})
)(ProjectsList)
