import * as React from 'react'
import { Popover } from '@blueprintjs/core'
import { EntityListDataProvider } from '../../binding'
import { DimensionSwitcherRenderer, DimensionSwitcherRendererProps } from './MenuItemsRenderer'
import { DimensionSwitcherItem } from './DimensionSwitcherItem'

interface DimensionsSwitcherState {
	isOpen: boolean
}

export interface DimensionsSwitcherProps {
	entityName: string
	dimension: string
	labelName: string
	valueName: string
	maxItems: number
	opener: JSX.Element
}

export default class DimensionsSwitcher extends React.Component<DimensionsSwitcherProps, DimensionsSwitcherState> {
	state: DimensionsSwitcherState = {
		isOpen: false
	}

	static defaultProps: Partial<DimensionsSwitcherProps> = {
		maxItems: 2
	}

	render() {
		return (
			<Popover
				isOpen={this.state.isOpen}
				target={this.props.opener}
				onInteraction={target => this.setState({ isOpen: target })}
				content={
					<EntityListDataProvider<DimensionSwitcherRendererProps>
						name={this.props.entityName}
						renderer={DimensionSwitcherRenderer}
						rendererProps={{
							dimension: this.props.dimension,
							labelName: this.props.labelName,
							valueName: this.props.valueName,
							maxItems: this.props.maxItems
						}}
					>
						<DimensionSwitcherItem labelName={this.props.labelName} valueName={this.props.valueName} />
					</EntityListDataProvider>
				}
			/>
		)
	}
}
