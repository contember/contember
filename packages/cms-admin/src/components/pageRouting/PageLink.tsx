import * as React from 'react'
import { connect } from 'react-redux'
import State from '../../state'
import { pageRequest } from '../../state/request'
import Link, { InnerProps } from '../Link'

export type PageConfig = {
	name: string
	params?: {}
}

type PageChange = () => PageConfig

class PageLink extends React.Component<Props> {
	render() {
		const { children, Component, project, change, stage, ...props } = this.props
		const changed = change()
		return (
			<Link
				Component={Component}
				requestChange={pageRequest(project, stage, changed.name, changed.params || {})}
				{...props}
			>
				{children}
			</Link>
		)
	}
}

interface StateProps {
	project: string
	stage: string
}

export interface PageLinkProps {
	change: PageChange
	Component?: React.ComponentType<InnerProps>
}

type Props = PageLinkProps & StateProps

export default connect<StateProps, {}, PageLinkProps, State>(({ view }) => {
	if (view.route && view.route.name === 'project_page') {
		return { project: view.route.project, stage: view.route.stage }
	} else {
		throw 'Cannot render PageLink outside project pages.'
	}
})(PageLink)
