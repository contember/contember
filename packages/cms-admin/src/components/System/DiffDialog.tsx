import * as React from 'react'
import { connect } from 'react-redux'
import { fetchDiff } from '../../actions/system'
import { Dispatch } from '../../actions/types'
import State from '../../state'
import { pushRequest } from '../../actions/request'
import { pageRequest } from '../../state/request'
import { Button, FormGroup, InputGroup } from '../ui'

class ConnectedDiffDialog extends React.PureComponent<
	DiffDialog.Props & DiffDialog.StateProps & DiffDialog.DispatchProps,
	DiffDialog.State
> {
	state: DiffDialog.State = {
		targetStage: ''
	}

	updateTargetState(value: string) {
		this.setState({ targetStage: value })
	}

	onSubmit = (e: React.FormEvent<unknown>) => {
		e.preventDefault()
		this.props.onShowDiff(this.props.project, this.props.stage, this.props.viewPageName, this.state.targetStage)
	}

	render() {
		return (
			<form onSubmit={this.onSubmit}>
				<FormGroup label="Stage slug">
					<InputGroup onChange={e => this.updateTargetState(e.target.value)} />
				</FormGroup>

				<Button
					Component={({ children, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
						<input type="submit" value="Show diff" {...props} />
					)}
				/>
			</form>
		)
	}
}

namespace DiffDialog {
	export interface Props {
		viewPageName: string
	}

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

export const DiffDialog = connect<DiffDialog.StateProps, DiffDialog.DispatchProps, DiffDialog.Props, State>(
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
		}
	})
)(ConnectedDiffDialog)
