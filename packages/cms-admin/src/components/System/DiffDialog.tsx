import * as React from 'react'
import { connect } from 'react-redux'
import { fetchDiff } from '../../actions/system'
import { Dispatch } from '../../actions/types'
import State from '../../state'
import { pushRequest } from '../../actions/request'
import { pageRequest } from '../../state/request'

class DiffDialog extends React.PureComponent<DiffDialog.StateProps & DiffDialog.DispatchProps, DiffDialog.State> {
	state: DiffDialog.State = {
		targetStage: ''
	}

	updateTargetState(value: string) {
		this.setState({ targetStage: value })
	}

	showDiff() {
		this.props.onShowDiff(this.props.project, this.props.stage, this.props.pageName, this.state.targetStage)
	}

	render() {
		return (
			<form>
				<input type={'text'} onChange={e => this.updateTargetState(e.target.value)} />
				<a onClick={() => this.showDiff()}>Show diff</a>
			</form>
		)
	}
}

namespace DiffDialog {
	export interface State {
		targetStage: string
	}

	export interface StateProps {
		project: string
		stage: string
		pageName: string
	}

	export interface DispatchProps {
		onShowDiff: (project: string, headStage: string, pageName: string, baseStage: string) => void
	}
}

export default connect<DiffDialog.StateProps, DiffDialog.DispatchProps, {}, State>(
	state => {
		if (state.request.name !== 'project_page') {
			throw new Error()
		}
		return {
			project: state.request.project,
			stage: state.request.stage,
			pageName: state.request.pageName
		}
	},
	(dispatch: Dispatch) => ({
		onShowDiff: (project, headStage, pageName, baseStage) => {
			dispatch(pushRequest(pageRequest(project, headStage, pageName, { targetStage: baseStage })))
			dispatch(fetchDiff(baseStage))
		}
	})
)(DiffDialog)
