import * as React from 'react'
import { connect } from 'react-redux'
import { pushRequest } from '../../actions/request'
import { Dispatch } from '../../actions/types'
import State from '../../state'
import { RequestChange } from '../../state/request'

export interface DynamicLinkInnerProps {
	onClick: () => void
	children: React.ReactElement | null
}

export interface DynamicLinkDispatchProps {
	goTo: () => void
}

export interface DynamicLinkOwnProps {
	requestChange: RequestChange
	children?: React.ReactElement | null
	Component: React.ComponentType<DynamicLinkInnerProps>
}

export type DynamicLinkProps = DynamicLinkDispatchProps & DynamicLinkOwnProps

const DynamicLinkComponent = (props: DynamicLinkProps) => {
	const Component = props.Component

	return <Component onClick={props.goTo}>{props.children || null}</Component>
}
DynamicLinkComponent.displayName = 'DynamicLink'

export const DynamicLink = connect<{}, DynamicLinkDispatchProps, DynamicLinkOwnProps, State>(
	undefined,
	(dispatch: Dispatch, { requestChange }) => ({ goTo: () => dispatch(pushRequest(requestChange)) }),
)(DynamicLinkComponent)
