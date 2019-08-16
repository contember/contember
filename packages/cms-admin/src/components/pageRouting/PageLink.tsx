import * as React from 'react'
import { connect } from 'react-redux'
import State from '../../state'
import { pageRequest } from '../../state/request'
import Link, { PublicAnchorProps } from '../Link'
import LinkComponent from '../Link/LinkComponent'

export type PageConfig = {
	name: string
	params?: {}
}

type PageChange = () => PageConfig

const PageLink = React.memo(({ project, change, stage, ...props }: Props) => {
	const changed = change()
	return <Link requestChange={pageRequest(project, stage, changed.name, changed.params || {})} {...props} />
})

interface StateProps {
	project: string
	stage: string
}

export interface PageLinkProps extends Omit<LinkComponent.Props, 'goTo' | 'href' | 'requestChange'> {
	change: PageChange
}

type Props = PageLinkProps & StateProps & PublicAnchorProps

export default connect<StateProps, {}, PageLinkProps, State>(({ view }) => {
	if (view.route && view.route.name === 'project_page') {
		return { project: view.route.project, stage: view.route.stage }
	} else {
		throw 'Cannot render PageLink outside project pages.'
	}
})(PageLink)
