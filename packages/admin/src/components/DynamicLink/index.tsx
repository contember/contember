import type { ComponentType, ReactElement } from 'react'
import { connect } from 'react-redux'
import { pushRequest } from '../../actions/request'
import type { Dispatch } from '../../actions/types'
import routes from '../../routes'
import type State from '../../state'
import type { RequestChange } from '../../state/request'
import { isUrlActive } from '../../utils/isUrlActive'
import { requestStateToPath } from '../../utils/url'

export interface DynamicLinkInnerProps {
	onClick: () => void
	children: ReactElement | null
	isActive: boolean
}

export interface DynamicLinkStateProps {
	url: string
}

export interface DynamicLinkDispatchProps {
	goTo: () => void
}

export interface DynamicLinkOwnProps {
	requestChange: RequestChange
	children?: ReactElement | null
	Component: ComponentType<DynamicLinkInnerProps>
}

export type DynamicLinkProps = DynamicLinkDispatchProps & DynamicLinkStateProps & DynamicLinkOwnProps

const DynamicLinkComponent = (props: DynamicLinkProps) => {
	const Component = props.Component

	return (
		<Component onClick={props.goTo} isActive={isUrlActive(props.url)}>
			{props.children || null}
		</Component>
	)
}
DynamicLinkComponent.displayName = 'DynamicLink'

export const DynamicLink = connect<DynamicLinkStateProps, DynamicLinkDispatchProps, DynamicLinkOwnProps, State>(
	({ view, projectsConfigs, request }, { requestChange }) => ({
		url: requestStateToPath(routes(projectsConfigs.configs), requestChange(request)),
	}),
	(dispatch: Dispatch, { requestChange }) => ({ goTo: () => dispatch(pushRequest(requestChange)) }),
)(DynamicLinkComponent)
