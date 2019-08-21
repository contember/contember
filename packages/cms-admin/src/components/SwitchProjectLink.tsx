import * as React from 'react'
import { connect } from 'react-redux'
import State from '../state'
import { Link } from './index'
import { InnerProps } from './Link'

interface SwitchProjectLinkProps {
	Component?: React.ComponentType<InnerProps>
}

interface SwitchProjectStateProps {
	hasMoreProjects: boolean
}

type Props = SwitchProjectStateProps & SwitchProjectLinkProps

class SwitchProjectLink extends React.Component<Props, {}> {
	render() {
		if (!this.props.hasMoreProjects) {
			return null
		}
		return <Link requestChange={() => ({ name: 'projects_list' })} Component={this.props.Component} />
	}
}

export default connect<SwitchProjectStateProps, {}, SwitchProjectLinkProps, State>(state => ({
	hasMoreProjects: !!(state.auth.identity && state.auth.identity.projects.length > 1),
}))(SwitchProjectLink)
