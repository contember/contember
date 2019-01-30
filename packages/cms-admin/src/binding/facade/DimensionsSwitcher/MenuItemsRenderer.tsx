import * as React from 'react'
import { Button, Menu, MenuItem, Divider, Spinner } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import { Dimensions, Link } from '../../../components'
import { RendererProps, EntityCollectionAccessor, FieldAccessor } from '../..'
import { LoadingSpinner } from '../../facade/renderers/userFeedback'

export interface DimensionSwitcherRendererProps {
	dimension: string
	labelName: string
	valueName: string
	maxItems: number
}

interface DimensionsSwitcherRendererState {
	isAdding: boolean
}

export class DimensionSwitcherRenderer extends React.PureComponent<
	RendererProps & DimensionSwitcherRendererProps,
	DimensionsSwitcherRendererState
> {
	state: DimensionsSwitcherRendererState = {
		isAdding: false
	}
	private renderColumn(selectedValue: string | null, index: number): React.ReactNode {
		const { data } = this.props
		if (typeof data === 'undefined') return null
		const normalizedData = data.root instanceof EntityCollectionAccessor ? data.root.entities : [data.root]
		return (
			<Menu className="dimensionsSwitcher-menu">
				{normalizedData.map((dataValue, i) => {
					const value = dataValue && dataValue.data.getField(this.props.valueName)
					const label = dataValue && dataValue.data.getField(this.props.labelName)
					if (
						dataValue &&
						typeof dataValue.primaryKey === 'string' &&
						value instanceof FieldAccessor &&
						label instanceof FieldAccessor
					) {
						const currentValue = value.currentValue
						if (typeof currentValue !== 'string') {
							return null
						}
						return (
							<Link
								key={dataValue.primaryKey}
								Component={({ href, onClick }) => (
									<MenuItem
										href={href}
										onClick={onClick}
										text={label.currentValue}
										active={selectedValue == value.currentValue}
										shouldDismissPopover={false}
									/>
								)}
								requestChange={reqState => {
									if (reqState.name !== 'project_page') {
										return reqState
									}
									const dimensionName = this.props.dimension
									const dimension = [...(reqState.dimensions[dimensionName] || [])]
									if (dimension[index] === currentValue) {
										dimension.splice(index, 1)
									} else {
										dimension[index] = currentValue
									}
									return {
										...reqState,
										dimensions: { ...(reqState.dimensions || {}), [dimensionName]: dimension }
									}
								}}
							/>
						)
					}
					return null
				})}
			</Menu>
		)
	}
	public render() {
		if (!this.props.data) {
			return <LoadingSpinner size={Spinner.SIZE_SMALL} />
		}
		return (
			<div className="dimensionsSwitcher-wrapper">
				<Dimensions>
					{dimensions => {
						const currentValue = dimensions[this.props.dimension] || []
						return (
							<>
								{currentValue.map((current, i) => {
									return (
										<React.Fragment key={i}>
											{!!i && <Divider />}
											{this.renderColumn(current, i)}
										</React.Fragment>
									)
								})}
								{(this.state.isAdding || currentValue.length < this.props.maxItems) &&
									currentValue.length > 0 && <Divider />}
								{this.state.isAdding && this.renderColumn(null, currentValue.length)}
								{!this.state.isAdding &&
									currentValue.length < this.props.maxItems && (
										<Button icon={IconNames.ADD} minimal={true} onClick={() => this.setState({ isAdding: true })} />
									)}
							</>
						)
					}}
				</Dimensions>
			</div>
		)
	}
}
