import { Component as ReactComponent, ReactNode } from 'react'
import { connect } from 'react-redux'
import type State from '../state'
import type { SelectedDimension } from '../state/request'

interface DimensionsStateProps<D extends SelectedDimension> {
	dimensions: D
}

interface DimensionsOwnProps<D extends SelectedDimension> {
	children: (dimensions: D) => ReactNode
}

class Dimensions<D extends SelectedDimension> extends ReactComponent<DimensionsStateProps<D> & DimensionsOwnProps<D>> {
	public render() {
		return this.props.children(this.props.dimensions)
	}
}

export default connect<DimensionsStateProps<SelectedDimension>, {}, DimensionsOwnProps<SelectedDimension>, State>(
	(state: State): DimensionsStateProps<SelectedDimension> => {
		return {
			dimensions: state.request.name === 'project_page' ? state.request.dimensions : {},
		}
	},
)(Dimensions)
