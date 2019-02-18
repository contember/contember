import { Spinner } from '@blueprintjs/core'
import * as React from 'react'
import { Manager, Popper, Reference } from 'react-popper'
import { Button, Dropdown, Link } from '../../../components'
import { Portal } from '../../../components/ui/Portal'
import {
	AccessorTreeRoot,
	EntityAccessor,
	EntityCollectionAccessor,
	EntityListDataProvider,
	Environment,
	EnvironmentContext,
	Field,
	FieldAccessor,
	RendererProps
} from '../../index'
import { QueryLanguage } from '../../queryLanguage'
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
				immutable={true}
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
					{QueryLanguage.wrapRelativeSingleField(
						props.labelName,
						fieldName => (
							<Field name={fieldName} />
						),
						environment
					)}
					{QueryLanguage.wrapRelativeSingleField(
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
		buttonProps?: any // Pick<IButtonProps, Exclude<keyof IButtonProps, 'text'>>
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
				<EnvironmentContext.Consumer>
					{environment => {
						const uniqueDimensions = this.getUniqueDimensions(environment.getDimensions()[this.props.dimension] || [])
						const normalizedData = this.getNormalizedData(uniqueDimensions, this.props.data)

						return (
							<Manager>
								<Reference>
									{({ ref }) => (
										<Button
											ref={ref}
											onClick={() => this.setState(p => ({ ...p, isOpen: !p.isOpen, isAdding: false }))}
										>
											{this.renderTarget(normalizedData)}
										</Button>
									)}
								</Reference>
								{this.state.isOpen && (
									<Portal>
										<Popper placement="auto">
											{({ ref, style, placement, arrowProps }) => (
												<div ref={ref} style={{ ...style, zIndex: 20 }} data-placement={placement}>
													{this.renderContent(normalizedData, uniqueDimensions)}
													<div ref={arrowProps.ref} style={arrowProps.style} />
												</div>
											)}
										</Popper>
									</Portal>
								)}
							</Manager>
						)
					}}
				</EnvironmentContext.Consumer>
			)
		}

		private renderTarget(dimensionData: undefined | NormalizedDimensionData[]): React.ReactNode {
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
			return text
		}

		private renderContent(dimensionData: undefined | NormalizedDimensionData[], selectedDimensions: string[]) {
			if (!dimensionData) {
				return <LoadingSpinner size={Spinner.SIZE_SMALL} />
			}
			const selectedDimensionsCount = selectedDimensions.length
			const canSelectAnother = selectedDimensionsCount < this.props.maxItems
			const columnCount = selectedDimensionsCount + (this.state.isAdding && canSelectAnother ? 1 : 0)

			return (
				<Dropdown columns>
					{[...Array(columnCount)].map((_, i) => {
						return (
							<Dropdown.Column key={i}>
								{dimensionData.map(dimension => {
									const active = selectedDimensions[i] === dimension.slug
									return (
										<Link
											key={dimension.slug}
											Component={({ href, onClick }) => (
												<Dropdown.Item {...{ href, onClick, active }}>{dimension.label}</Dropdown.Item>
											)}
											requestChange={reqState => {
												if (reqState.name !== 'project_page') {
													return reqState
												}
												const dimensionName = this.props.dimension
												const dimensions = [...selectedDimensions]
												if (dimensions[i] === dimension.slug) {
													dimensions.splice(i, 1)
												} else {
													dimensions[i] = dimension.slug
												}
												return {
													...reqState,
													dimensions: {
														...(reqState.dimensions || {}),
														[dimensionName]: this.getUniqueDimensions(dimensions)
													}
												}
											}}
										/>
									)
								})}
							</Dropdown.Column>
						)
					})}
					{!this.state.isAdding &&
						canSelectAnother && (
							<Button onClick={() => this.setState({ isAdding: true })} small>
								Add
							</Button>
						)}
				</Dropdown>
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
