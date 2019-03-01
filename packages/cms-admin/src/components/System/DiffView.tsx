import * as React from 'react'
import { AnyStageDiff, StageDiffState } from '../../state/system'
import { connect } from 'react-redux'
import State from '../../state'
import { executeRelease } from '../../actions/system'
import { Dispatch } from '../../actions/types'

enum SelectionType {
	explicit = 'explicit',
	dependency = 'dependency'
}

class DiffView extends React.PureComponent<DiffView.StateProps & DiffView.DispatchProps, DiffView.State> {
	state: DiffView.State = {
		selected: []
	}

	calculateSelected(): { [id: string]: SelectionType } {
		const explicit: { [id: string]: SelectionType } = this.state.selected.reduce(
			(acc, id) => ({ ...acc, [id]: SelectionType.explicit }),
			{}
		)
		const dependencies: { [id: string]: SelectionType } = this.state.selected
			.map(id => this.getDependencies(id))
			.reduce((acc, deps) => [...acc, ...deps], [])
			.reduce((acc, id) => ({ ...acc, [id]: SelectionType.dependency }), {})

		return { ...dependencies, ...explicit }
	}

	getDependencies(id: string, visited: string[] = []): string[] {
		if (!this.props.diff || this.props.diff.state !== StageDiffState.DIFF_DONE) {
			return []
		}
		const event = this.props.diff.events.find(it => it.id === id)
		if (!event) {
			return []
		}
		const dependencies = event.dependencies.filter(id => !visited.includes(id))
		const newVisited = [...visited, ...dependencies]
		return [
			...dependencies,
			...dependencies.map(id => this.getDependencies(id, newVisited)).reduce((acc, val) => [...acc, ...val], [])
		]
	}

	execRelease() {
		const events = [
			...this.state.selected,
			...this.state.selected.map(it => this.getDependencies(it)).reduce((acc, val) => [...acc, ...val], [])
		]
		this.setState({ selected: [] })
		this.props.onRelease(this.props.diff!.baseStage, events)
	}

	render() {
		if (!this.props.diff) {
			return null
		}
		if (this.props.diff.state !== StageDiffState.DIFF_DONE) {
			return '...'
		}
		const selected = this.calculateSelected()
		return (
			<>
				<ul>
					{this.props.diff.events.map(it => (
						<li
							style={{
								backgroundColor: selected[it.id]
									? {
											[SelectionType.explicit]: '#009b00',
											[SelectionType.dependency]: '#b2ffa6'
									  }[selected[it.id]]
									: '#fff'
							}}
							onClick={() =>
								this.setState(prev => ({
									selected: [
										...prev.selected.filter(id => id !== it.id),
										...(prev.selected.includes(it.id) ? [] : [it.id])
									]
								}))
							}
						>
							{it.description}
						</li>
					))}
				</ul>
				<a onClick={() => this.execRelease()}>Release</a>
			</>
		)
	}
}

namespace DiffView {
	export interface StateProps {
		diff: AnyStageDiff | null
	}

	export interface DispatchProps {
		onRelease: (baseStage: string, events: string[]) => void
	}

	export interface State {
		selected: string[]
	}
}

export default connect<DiffView.StateProps, DiffView.DispatchProps, {}, State>(
	state => {
		const request = state.request
		if (request.name !== 'project_page' || !request.parameters.targetStage) {
			return { diff: null }
		}
		const diff =
			state.system.diffs.find(
				it => it.headStage === request.stage && it.baseStage === request.parameters.targetStage
			) || null

		return {
			diff
		}
	},
	(dispatch: Dispatch) => {
		return {
			onRelease: (baseStage, events) => dispatch(executeRelease(baseStage, events))
		}
	}
)(DiffView)
