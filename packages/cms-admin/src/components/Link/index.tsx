import * as React from 'react'
import { requestStateToPath } from '../../utils/url'
import { connect } from 'react-redux'
import State from '../../state'
import { Dispatch } from '../../actions/types'
import { pushRequest } from '../../actions/request'
import routes from '../../routes'
import LinkComponent, { InnerProps } from './LinkComponent'

export default connect<LinkComponent.StateProps, LinkComponent.DispatchProps, LinkComponent.OwnProps, State>(
	({ view, projectsConfigs, request }, { requestChange }) => ({
		url: requestStateToPath(routes(projectsConfigs.configs), requestChange(request))
	}),
	(dispatch: Dispatch, { requestChange }) => ({ goTo: () => dispatch(pushRequest(requestChange)) })
)(LinkComponent)

export { InnerProps }
