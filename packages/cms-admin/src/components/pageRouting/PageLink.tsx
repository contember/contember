import * as React from 'react'
import Link, { InnerProps } from '../Link'
import { pageRequest } from '../../state/request'
import { connect } from 'react-redux'
import State from '../../state'

type ParamByName<P extends AnyParams, N extends string> = P extends { [A in N]: infer R } ? R : never
type AnyParams = { [key: string]: any }
type ParamNames<P extends AnyParams> = keyof P

type PageConfig<P extends AnyParams, N extends ParamNames<P>> = {
	name: N & string
	params: any // ParamByName<P, N>
}

type PageChange<P extends AnyParams> = () => PageConfig<P, keyof P>

class PageLink<P> extends React.Component<any | Props<P>> {
	render() {
		const changed = this.props.change()
		return (
			<Link
				Component={this.props.Component}
				requestChange={pageRequest(this.props.project, this.props.stage, changed.name, changed.params)}
			>
				{this.props.children}
			</Link>
		)
	}
}

interface StateProps {
	project: string
	stage: string
}

export interface PageLinkProps<P> {
	change: PageChange<P>
	Component?: React.ComponentType<InnerProps>
}

type Props<P> = PageLinkProps<P> & StateProps

export default connect<StateProps, {}, PageLinkProps<any>, State>(({ view }) => {
	if (view.route && view.route.name === 'project_page') {
		return { project: view.route.project, stage: view.route.stage }
	} else {
		throw 'Cannot render PageLink outside project pages.'
	}
})(PageLink)
