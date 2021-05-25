import { Component as ReactComponent, ComponentType } from 'react'
import { connect } from 'react-redux'
import type State from '../state'
import { InnerProps, Link } from './Link'

interface SwitchProjectLinkProps {
	Component?: ComponentType<InnerProps>
}

interface SwitchProjectStateProps {
	hasMoreProjects: boolean
}

type Props = SwitchProjectStateProps & SwitchProjectLinkProps

class SwitchProjectLink extends ReactComponent<Props, {}> {
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
