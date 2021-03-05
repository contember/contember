import { Button, FormGroup, TextInput } from '@contember/ui'
import { FormEvent, PureComponent } from 'react'
import { connect } from 'react-redux'
import { pushRequest } from '../../actions/request'
import { Dispatch } from '../../actions/types'
import State from '../../state'
import { pageRequest } from '../../state/request'

class ConnectedDiffDialog extends PureComponent<
	DiffDialog.Props & DiffDialog.StateProps & DiffDialog.DispatchProps,
	DiffDialog.State
> {
	state: DiffDialog.State = {
		targetStage: '',
	}

	updateTargetState(value: string) {
		this.setState({ targetStage: value })
	}

	onSubmit = (e: FormEvent<unknown>) => {
		e.preventDefault()
		this.props.onShowDiff(this.props.project, this.props.stage, this.props.viewPageName, this.state.targetStage)
	}

	render() {
		return (
			<form onSubmit={this.onSubmit}>
				<FormGroup label="Stage slug">
					<TextInput
						value={this.state.targetStage}
						onChange={e => this.updateTargetState(e.target.value)}
						allowNewlines={false}
					/>
				</FormGroup>

				<Button type="submit">Show diff</Button>
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
			pageName: state.request.pageName,
		}
	},
	(dispatch: Dispatch) => ({
		onShowDiff: (project, headStage, pageName, baseStage) => {
			dispatch(pushRequest(pageRequest(project, headStage, pageName, { targetStage: baseStage })))
		},
	}),
)(ConnectedDiffDialog)
