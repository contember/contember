import { connect } from 'react-redux'
import { pushRequest } from '../../actions/request'
import type { Dispatch } from '../../actions/types'
import routes from '../../routes'
import type State from '../../state'
import { requestStateToPath } from '../../utils/url'
import { InnerProps, LinkComponent, PublicAnchorProps } from './LinkComponent'

export const Link = connect<LinkComponent.StateProps, LinkComponent.DispatchProps, LinkComponent.OwnProps, State>(
	({ projectConfig, request }, { requestChange }) => ({
		href: requestStateToPath(routes([projectConfig]), requestChange(request)),
	}),
	(dispatch: Dispatch, { requestChange }) => ({ goTo: () => dispatch(pushRequest(requestChange)) }),
)(LinkComponent)

export type { InnerProps, PublicAnchorProps }
