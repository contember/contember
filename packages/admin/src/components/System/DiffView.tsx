import { Button, Icon, TableRow, Table, TableCell, Spinner } from '@contember/ui'
import { PureComponent } from 'react'
import { connect } from 'react-redux'
import cn from 'classnames'
import { AnyStageDiff, StageDiffState, EventType } from '../../state/system'
import State from '../../state'
import { executeRelease, fetchDiff } from '../../actions/system'
import { Dispatch } from '../../actions/types'
import { assertNever } from '@contember/utils'

enum SelectionType {
	explicit = 'explicit',
	dependency = 'dependency',
}

class DiffViewInner extends PureComponent<DiffView.StateProps & DiffView.DispatchProps, DiffView.State> {
	state: DiffView.State = {
		selected: [],
	}

	calculateSelected(): { [id: string]: SelectionType } {
		const explicit: { [id: string]: SelectionType } = this.state.selected.reduce(
			(acc, id) => ({ ...acc, [id]: SelectionType.explicit }),
			{},
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
			...dependencies.map(id => this.getDependencies(id, newVisited)).reduce((acc, val) => [...acc, ...val], []),
		]
	}

	execRelease = () => {
		const events = [
			...this.state.selected,
			...this.state.selected.map(it => this.getDependencies(it)).reduce((acc, val) => [...acc, ...val], []),
		]
		this.setState({ selected: [] })
		this.props.onRelease(this.props.diff!.baseStage, events)
	}

	componentDidMount() {
		this.props.onFetch(this.props.targetStage)
	}

	private renderIcon(type: EventType) {
		switch (type) {
			case EventType.RUN_MIGRATION:
				return <Icon blueprintIcon="code" />
			case EventType.CREATE:
				return <Icon blueprintIcon="plus" />
			case EventType.UPDATE:
				return <Icon blueprintIcon="edit" />
			case EventType.DELETE:
				return <Icon blueprintIcon="trash" />
			default:
				assertNever(type)
		}
	}

	render() {
		const { diff } = this.props
		if (!diff) {
			return null
		}
		if (diff.state === StageDiffState.DIFF_FETCHING) {
			return <Spinner />
		}
		if (diff.state === StageDiffState.DIFF_FAILED) {
			return `Failed loading because ${diff.errors && diff.errors.join(', ')}`
		}
		const selected = this.calculateSelected()
		return (
			<>
				<Table>
					{diff.events.map(it => (
						<TableRow>
							<TableCell shrunk>
								<button
									role="button"
									onClick={e => {
										this.setState(prev => ({
											selected: [
												...prev.selected.filter(id => id !== it.id),
												...(prev.selected.includes(it.id) ? [] : [it.id]),
											],
										}))
									}}
									className={cn(
										'diffView',
										selected[it.id] === SelectionType.explicit && 'is-explicit',
										selected[it.id] === SelectionType.dependency && 'is-dependency',
									)}
								>
									Click
								</button>
							</TableCell>
							<TableCell>
								<input
									type="checkbox"
									checked={selected[it.id] ? true : false}
									disabled={selected[it.id] == SelectionType.dependency}
									onChange={e => {
										const targetState = e.target.checked
										this.setState(prev => ({
											selected: [...prev.selected.filter(id => id !== it.id), ...(targetState ? [it.id] : [])],
										}))
									}}
								/>
							</TableCell>
							<TableCell>{this.renderIcon(it.type)}</TableCell>
							<TableCell>{it.description}</TableCell>
						</TableRow>
					))}
				</Table>
				<Button onClick={this.execRelease}>Release</Button>
			</>
		)
	}
}

namespace DiffView {
	export interface StateProps {
		targetStage: string
		diff: AnyStageDiff | null
	}

	export interface DispatchProps {
		onRelease: (baseStage: string, events: string[]) => void
		onFetch: (baseStage: string) => void
	}

	export interface State {
		selected: string[]
	}
}

export const DiffView = connect<DiffView.StateProps, DiffView.DispatchProps, {}, State>(
	state => {
		const request = state.request
		if (request.name !== 'project_page' || !request.parameters.targetStage) {
			throw new Error('DiffView component need to be in project page with targetStage param')
		}
		const targetStage = request.parameters.targetStage
		const diff = state.system.diffs.find(it => it.headStage === request.stage && it.baseStage === targetStage) || null

		return {
			diff,
			targetStage,
		}
	},
	(dispatch: Dispatch) => {
		return {
			onRelease: (baseStage, events) => dispatch(executeRelease(baseStage, events)),
			onFetch: baseStage => dispatch(fetchDiff(baseStage)),
		}
	},
)(DiffViewInner)
