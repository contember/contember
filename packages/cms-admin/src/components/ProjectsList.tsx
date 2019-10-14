import { Button, ButtonList } from '@contember/ui'
import * as React from 'react'
import { connect } from 'react-redux'
import { MiscPageLayout, ProjectConfig } from '..'
import { pushRequest } from '../actions/request'
import { Dispatch } from '../actions/types'
import State from '../state'
import { RequestChange } from '../state/request'
import { Link } from './Link'

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

class ProjectsList extends React.Component<ProjectsListProps, {}> {
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
