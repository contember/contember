import { Button, Divider, IButtonProps, Menu, MenuItem, Popover, Spinner } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import * as React from 'react'
import { Dimensions, Link } from '../../../components'
import { SelectedDimension } from '../../../state/request'
import {
	AccessorTreeRoot,
	EntityAccessor,
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
					buttonProps: this.props.buttonProps,
					dimension: this.props.dimension,
					emptyText: this.props.emptyText,
					labelName: this.props.labelName,
					maxItems: this.props.maxItems,
					renderSelectedText: this.props.renderSelectedText,
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
		dimension: string
		labelName: string
		valueName: string
		maxItems: number
		emptyText: React.ReactNode
		renderSelectedText?: (dimensionData: NormalizedDimensionData[]) => React.ReactNode
		buttonProps?: Pick<IButtonProps, Exclude<keyof IButtonProps, 'text'>>
	}

	interface DimensionsRendererState {
		isAdding: boolean
		isOpen: boolean
	}

	interface NormalizedDimensionData {
		slug: string
		label: string
		isSelected: boolean
	}

	export class DimensionsRenderer extends React.Component<
		RendererProps & DimensionsRendererProps,
		DimensionsRendererState
	> {
		static defaultProps: Partial<DimensionsSwitcherProps> = {
			maxItems: 2
		}

		state: DimensionsRendererState = {
			isAdding: false,
			isOpen: false
		}

		public render() {
			return (
				<Dimensions>
					{dimensions => {
						const uniqueDimensions = this.getUniqueDimensions(dimensions[this.props.dimension] || [])
						const normalizedData = this.getNormalizedData(uniqueDimensions, this.props.data)

						return (
							<Popover isOpen={this.state.isOpen} onInteraction={target => this.setState({ isOpen: target })}>
								{this.renderTarget(normalizedData)}
								{this.renderContent(normalizedData, uniqueDimensions)}
							</Popover>
						)
					}}
				</Dimensions>
			)
		}

		private renderTarget(dimensionData: undefined | NormalizedDimensionData[]): React.ReactNode {
			const defaultProps: IButtonProps = {
				rightIcon: IconNames.CHEVRON_DOWN
			}
			let text: React.ReactNode

			if (dimensionData) {
				const normalizedSelected = dimensionData.filter(item => item.isSelected)

				if (normalizedSelected.length) {
					if (this.props.renderSelectedText) {
						text = this.props.renderSelectedText(normalizedSelected)
					} else {
						text = normalizedSelected.map(datum => datum.label).join(', ')
					}
				} else {
					text = this.props.emptyText
				}
			} else {
				text = this.props.emptyText
			}
			return <Button {...defaultProps} {...this.props.buttonProps} text={text} />
		}

		private renderContent(dimensionData: undefined | NormalizedDimensionData[], selectedDimensions: string[]) {
			if (!dimensionData) {
				return <LoadingSpinner size={Spinner.SIZE_SMALL} />
			}
			const selectedDimensionsCount = selectedDimensions.length
			const canSelectAnother = selectedDimensionsCount < this.props.maxItems
			const columnCount = selectedDimensionsCount + (this.state.isAdding && canSelectAnother ? 1 : 0)

			return (
				<div className="dimensionsSwitcher-wrapper">
					{[...Array(columnCount)].map((_, i) => {
						return (
							<React.Fragment key={i}>
								{!!i && <Divider />}
								<Menu className="dimensionsSwitcher-menu">
									{dimensionData.map((dimension, j) => {
										const isActive = selectedDimensions[i] === dimension.slug
										return (
											<Link
												key={j}
												Component={({ href, onClick }) => (
													<MenuItem
														href={href}
														onClick={onClick}
														text={dimension.label}
														active={isActive}
														disabled={!isActive && dimension.isSelected}
														shouldDismissPopover={false}
													/>
												)}
												requestChange={reqState => {
													if (reqState.name !== 'project_page') {
														return reqState
													}
													const dimensionName = this.props.dimension
													const selectedDimensions = [...(reqState.dimensions[dimensionName] || [])]
													if (selectedDimensions[i] === dimension.slug) {
														selectedDimensions.splice(i, 1)
													} else {
														selectedDimensions[i] = dimension.slug
													}
													return {
														...reqState,
														dimensions: {
															...(reqState.dimensions || {}),
															[dimensionName]: this.getUniqueDimensions(selectedDimensions)
														}
													}
												}}
											/>
										)
									})}
								</Menu>
							</React.Fragment>
						)
					})}
					{!this.state.isAdding &&
						canSelectAnother && (
							<>
								<Divider />
								<Button icon={IconNames.ADD} minimal={true} onClick={() => this.setState({ isAdding: true })} />
							</>
						)}
				</div>
			)
		}

		private getNormalizedData(
			currentDimensions: string[],
			data?: AccessorTreeRoot
		): undefined | NormalizedDimensionData[] {
			if (!data) {
				return undefined
			}
			const entities = data.root instanceof EntityCollectionAccessor ? data.root.entities : [data.root]
			const normalized: NormalizedDimensionData[] = []

			for (const entity of entities) {
				if (!(entity instanceof EntityAccessor)) {
					continue
				}
				const slug = entity.data.getField(this.props.valueName)
				const label = entity.data.getField(this.props.labelName)

				if (slug instanceof FieldAccessor && label instanceof FieldAccessor) {
					const slugValue = slug.currentValue
					const labelValue = label.currentValue

					if (typeof slugValue === 'string' && typeof labelValue === 'string') {
						normalized.push({
							slug: slugValue,
							label: labelValue,
							isSelected: currentDimensions.indexOf(slugValue) !== -1
						})
					}
				}
			}

			return normalized
		}

		private getUniqueDimensions(selectedDimensions: string[]): string[] {
			return selectedDimensions.filter((item, i, array) => array.indexOf(item) === i)
		}
	}
}

export { DimensionsSwitcher }
