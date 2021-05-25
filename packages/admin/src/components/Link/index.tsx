import { connect } from 'react-redux'
import { pushRequest } from '../../actions/request'
import type { Dispatch } from '../../actions/types'
import routes from '../../routes'
import type State from '../../state'
import { requestStateToPath } from '../../utils/url'
import { InnerProps, LinkComponent, PublicAnchorProps } from './LinkComponent'

export const Link = connect<LinkComponent.StateProps, LinkComponent.DispatchProps, LinkComponent.OwnProps, State>(
	({ view, projectsConfigs, request }, { requestChange }) => ({
		href: requestStateToPath(routes(projectsConfigs.configs), requestChange(request)),
	}),
	(dispatch: Dispatch, { requestChange }) => ({ goTo: () => dispatch(pushRequest(requestChange)) }),
)(LinkComponent)

export { InnerProps, PublicAnchorProps }
