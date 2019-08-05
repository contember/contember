import * as React from 'react'
import { Manager, Popper, Reference } from 'react-popper'
import { Button, Checkbox, Link } from '../../../components'
import { Portal } from '../../../components/ui/Portal'
import { RequestChange } from '../../../state/request'
import { isSpecialLinkClick } from '../../../utils/isSpecialLinkClick'
import {
	AccessorTreeRoot,
	DataBindingError,
	EntityAccessor,
	EntityCollectionAccessor,
	EntityListDataProvider,
	EntityListDataProviderProps,
	Environment,
	EnvironmentContext,
	FieldAccessor,
	FieldText,
	RendererProps,
	ToOne
} from '../../index'
import { QueryLanguage } from '../../queryLanguage'

export interface DimensionsSwitcherBaseProps extends Omit<DimensionsSwitcher.DimensionsRendererProps, 'labelFactory'> {
	options: string
	orderBy?: EntityListDataProviderProps<unknown>['orderBy']
}

export interface DimensionsSwitcherProps extends DimensionsSwitcherBaseProps {
	children?: DimensionsSwitcher.DimensionsRendererProps['labelFactory']
}

class DimensionsSwitcher extends React.PureComponent<DimensionsSwitcherProps> {
	static defaultProps: Partial<DimensionsSwitcherProps> = {
		minItems: 1,
		maxItems: 2
	}

	render() {
		this.validateProps()

		const environment = new Environment()
		const children = this.props.children
		const metadata: QueryLanguage.WrappedQualifiedEntityList | QueryLanguage.WrappedQualifiedFieldList = children
			? QueryLanguage.wrapQualifiedEntityList(this.props.options, children, environment)
			: QueryLanguage.wrapQualifiedFieldList(
					this.props.options,
					fieldName => <FieldText name={fieldName} />,
					environment
			  )

		return (
			<EntityListDataProvider<DimensionsSwitcher.DimensionsRendererProps>
				entityName={metadata.entityName}
				immutable={true}
				orderBy={this.props.orderBy}
				renderer={DimensionsSwitcher.DimensionsRenderer}
				rendererProps={{
					buttonProps: this.props.buttonProps,
					defaultValue: this.props.defaultValue,
					dimension: this.props.dimension,
					labelFactory: metadata.children,
					minItems: this.props.minItems,
					maxItems: this.props.maxItems,
					renderSelected: this.props.renderSelected,
					slugField: this.props.slugField
				}}
			>
				{metadata.children}
				<FieldText name={this.props.slugField} />
			</EntityListDataProvider>
		)
	}

	private validateProps() {
		if (this.props.minItems > this.props.maxItems) {
			throw new DataBindingError(
				`DimensionSwitcher: 'minItems' for dimension ${this.props.dimension} must be no greater than 'maxItems'.`
			)
		}
		if (this.props.minItems < 1) {
			throw new DataBindingError(
				`DimensionSwitcher: 'minItems' for dimension ${this.props.dimension} must be at least 1.`
			)
		}
		if (this.props.defaultValue.length < this.props.minItems || this.props.defaultValue.length > this.props.maxItems) {
			throw new DataBindingError(
				`DimensionSwitcher: the number of default values for dimension ${this.props.dimension} must not be between` +
					`'minItems' and 'maxItems'.`
			)
		}
	}
}

namespace DimensionsSwitcher {
	export type SelectedDimensionRenderer = (dimensionData: StatefulDimensionDatum<true>[]) => React.ReactNode

	export interface DimensionsRendererProps {
		buttonProps?: any // Pick<IButtonProps, Exclude<keyof IButtonProps, 'text'>>
		defaultValue: DimensionDatum[]
		dimension: string
		labelFactory: React.ReactNode
		maxItems: number
		minItems: number
		renderSelected?: SelectedDimensionRenderer
		slugField: string
	}

	export interface DimensionDatum {
		slug: string
		label: React.ReactNode
	}
	export interface StatefulDimensionDatum<IsSelected extends boolean = boolean> extends DimensionDatum {
		isSelected: IsSelected
	}

	export const DimensionsRenderer = (props: RendererProps & DimensionsRendererProps) => {
		const environment = React.useContext(EnvironmentContext)
		const [isOpen, setIsOpen] = React.useState(false)

		const toggleIsOpen = React.useCallback(() => setIsOpen(!isOpen), [isOpen])

		const renderSelected = (selectedDimensions: StatefulDimensionDatum<true>[]): React.ReactNode => {
			const renderer = props.renderSelected || renderByJoining

			return renderer(selectedDimensions)
		}

		const renderContent = (
			dimensionData: StatefulDimensionDatum[],
			selectedDimensions: StatefulDimensionDatum<true>[]
		) => {
			const canSelectJustOne = props.minItems === 1 && props.maxItems === 1
			const selectedDimensionsCount = selectedDimensions.length
			const canSelectAnother = selectedDimensionsCount < props.maxItems
			const canSelectLess = selectedDimensionsCount > props.minItems
			const getRequestChangeCallback = (dimension: StatefulDimensionDatum): RequestChange => reqState => {
				if (reqState.name !== 'project_page') {
					return reqState
				}

				let updatedDimensions: StatefulDimensionDatum[]

				if (!dimension.isSelected && !canSelectAnother) {
					// We're about to select another dimension but we have no more slots for it se we need to bump one off.
					updatedDimensions = [...selectedDimensions.slice(1), dimension] // isSelected is technically wrong here but it doesn't matter
				} else if (dimension.isSelected && !canSelectLess) {
					// We're trying to unselect a dimension but our 'minItems' prop disallows it. Do nothing then.
					updatedDimensions = selectedDimensions
				} else {
					updatedDimensions = dimensionData.filter(item => {
						if (item.slug === dimension.slug) {
							return !item.isSelected
						}
						return item.isSelected
					})
				}

				return {
					...reqState,
					dimensions: {
						...(reqState.dimensions || {}),
						[props.dimension]: getUniqueDimensions(updatedDimensions.map(item => item.slug))
					}
				}
			}

			return (
				<ul>
					{dimensionData.map(dimension => (
						<li key={dimension.slug}>
							<Link
								Component={({ href, onClick }) => {
									if (canSelectJustOne) {
										return (
											<a
												href={href}
												onClick={e => {
													if (isSpecialLinkClick(e)) {
														return
													}
													setIsOpen(false)
													onClick(e)
												}}
											>
												{dimension.label}
											</a>
										)
									}
									return (
										<Checkbox
											key={dimension.slug}
											checked={dimension.isSelected}
											label={dimension.label}
											readOnly={dimension.isSelected && !canSelectLess}
											onChange={() => onClick()}
										/>
									)
								}}
								requestChange={getRequestChangeCallback(dimension)}
							/>
						</li>
					))}
				</ul>
			)
		}

		const getNormalizedData = (currentDimensions: string[], data?: AccessorTreeRoot): StatefulDimensionDatum[] => {
			if (!data) {
				return currentDimensions.map(dimension => {
					return {
						slug: dimension,
						label: dimension, // We don't have the data to match the defaults with so this is better than nothing
						isSelected: true
					}
				})
			}
			const entities = data.root instanceof EntityCollectionAccessor ? data.root.entities : [data.root]
			const normalized: StatefulDimensionDatum[] = []

			for (const entity of entities) {
				if (!(entity instanceof EntityAccessor)) {
					continue
				}
				const slug = entity.data.getField(props.slugField)
				const label = <ToOne.AccessorRenderer accessor={entity}>{props.labelFactory}</ToOne.AccessorRenderer>

				if (slug instanceof FieldAccessor) {
					const slugValue = slug.currentValue

					if (typeof slugValue === 'string') {
						normalized.push({
							slug: slugValue,
							isSelected: currentDimensions.indexOf(slugValue) !== -1,
							label
						})
					}
				}
			}

			return normalized
		}

		const getUniqueDimensions = (selectedDimensions: string[]): string[] => {
			return selectedDimensions.filter((item, i, array) => array.indexOf(item) === i)
		}

		const uniqueDimensions = getUniqueDimensions(environment.getDimension(props.dimension) || [])
		const normalizedData = getNormalizedData(uniqueDimensions, props.data)
		const selectedDimensions = normalizedData.filter((item): item is StatefulDimensionDatum<true> => item.isSelected)

		if (normalizedData.length === 1) {
			// If there is just one alternative to choose from, render no drop-downs
			return <>{renderSelected(selectedDimensions)}</>
		}

		return (
			<Manager>
				<Reference>
					{({ ref }) => (
						<Button ref={ref} onClick={toggleIsOpen}>
							{renderSelected(selectedDimensions)}
						</Button>
					)}
				</Reference>
				{isOpen && (
					<Portal>
						<Popper placement="auto">
							{({ ref, style, placement, arrowProps }) => (
								<div ref={ref} style={{ ...style, zIndex: 20 }} data-placement={placement}>
									{renderContent(normalizedData, selectedDimensions)}
									<div ref={arrowProps.ref} style={arrowProps.style} />
								</div>
							)}
						</Popper>
					</Portal>
				)}
			</Manager>
		)
	}

	const renderByJoining: SelectedDimensionRenderer = dimensionData => {
		const output: React.ReactNode[] = []

		for (const [i, dimension] of dimensionData.entries()) {
			output.push(<React.Fragment key={dimension.slug}>{dimension.label}</React.Fragment>)

			if (i + 1 < dimensionData.length) {
				output.push(<React.Fragment key={`${dimension.slug}_separator`}>{', '}</React.Fragment>)
			}
		}

		return output
	}
}

export { DimensionsSwitcher }
