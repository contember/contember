import { connect } from 'react-redux'
import { pushRequest } from '../../actions/request'
import type { Dispatch } from '../../actions/types'
import type State from '../../state'
import { InnerProps, LinkComponent, PublicAnchorProps } from './LinkComponent'
import { requestStateToPath } from '../../routing'

export const Link = connect<LinkComponent.StateProps, LinkComponent.DispatchProps, LinkComponent.OwnProps, State>(
	({ basePath, projectConfig, request }, { requestChange }) => ({
		href: requestStateToPath(basePath, projectConfig, requestChange(request)),
	}),
	(dispatch: Dispatch, { requestChange }) => ({ goTo: () => dispatch(pushRequest(requestChange)) }),
)(LinkComponent)

export type { InnerProps, PublicAnchorProps }
