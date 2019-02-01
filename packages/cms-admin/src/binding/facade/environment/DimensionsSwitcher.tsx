import { Button, Divider, Menu, MenuItem, Popover, Spinner } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import * as React from 'react'
import { Dimensions, Link } from '../../../components'
import {
	EntityCollectionAccessor,
	EntityListDataProvider,
	Environment,
	Field,
	FieldAccessor,
	RendererProps
} from '../../index'
import { Parser } from '../../queryLanguage'
import { LoadingSpinner } from '../renderers/userFeedback'

export interface DimensionsSwitcherProps extends DimensionsSwitcher.DimensionsRendererProps {
	entityName: string
}

class DimensionsSwitcher extends React.PureComponent<DimensionsSwitcherProps> {
	static defaultProps: Partial<DimensionsSwitcherProps> = {
		maxItems: 2
	}

	render() {
		return (
			<EntityListDataProvider<DimensionsSwitcher.DimensionsRendererProps>
				name={this.props.entityName}
				renderer={DimensionsSwitcher.DimensionsRenderer}
				rendererProps={{
					dimension: this.props.dimension,
					labelName: this.props.labelName,
					maxItems: this.props.maxItems,
					opener: this.props.opener,
					valueName: this.props.valueName
				}}
			>
				<DimensionsSwitcher.Item labelName={this.props.labelName} valueName={this.props.valueName} />
			</EntityListDataProvider>
		)
	}
}

namespace DimensionsSwitcher {
	export interface ItemProps {
		labelName: string
		valueName: string
	}

	export class Item extends React.PureComponent<ItemProps> {
		public static displayName = 'DimensionSwitcherItem'
		public render() {
			return null
		}
		public static generateSyntheticChildren(props: ItemProps, environment: Environment): React.ReactNode {
			return (
				<>
					{Parser.generateWrappedNode(
						props.labelName,
						fieldName => (
							<Field name={fieldName} />
						),
						environment
					)}
					{Parser.generateWrappedNode(
						props.valueName,
						fieldName => (
							<Field name={fieldName} />
						),
						environment
					)}
				</>
			)
		}
	}

	export interface DimensionsRendererProps {
		opener: JSX.Element
		dimension: string
		labelName: string
		valueName: string
		maxItems: number
	}

	interface DimensionsRendererState {
		isAdding: boolean
		isOpen: boolean
	}

	export class DimensionsRenderer extends React.Component<
		RendererProps & DimensionsRendererProps,
		DimensionsRendererState
	> {
		static defaultProps: Partial<DimensionsSwitcherProps> = {
			maxItems: 2
		}

		shouldComponentUpdate(
			nextProps: Readonly<RendererProps & DimensionsSwitcher.DimensionsRendererProps>,
			nextState: Readonly<DimensionsRendererState>
		): boolean {
			return nextState.isAdding !== this.state.isAdding || nextState.isOpen !== this.state.isOpen
		}

		state: DimensionsRendererState = {
			isAdding: false,
			isOpen: false
		}
		private renderColumn(selectedValue: string | null, index: number): React.ReactNode {
			const { data } = this.props
			if (data === undefined) {
				return null
			}
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
			return (
				<Popover isOpen={this.state.isOpen} onInteraction={target => this.setState({ isOpen: target })}>
					{this.props.opener}
					{this.renderContent()}
				</Popover>
			)
		}

		private renderContent() {
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
}

export { DimensionsSwitcher }
