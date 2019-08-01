import * as React from 'react'
import { Manager, Popper, Reference } from 'react-popper'
import { Button, Dropdown, Link } from '../../../components'
import { Portal } from '../../../components/ui/Portal'
import { RequestChange } from '../../../state/request'
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
import { LoadingSpinner } from '../renderers/userFeedback'

export interface DimensionsSwitcherBaseProps extends Omit<DimensionsSwitcher.DimensionsRendererProps, 'labelFactory'> {
	options: string
	orderBy?: EntityListDataProviderProps<unknown>['orderBy']
}

export type DimensionsSwitcherProps = DimensionsSwitcherBaseProps &
	({ labelField: string } | { children: DimensionsSwitcher.DimensionsRendererProps['labelFactory'] })

class DimensionsSwitcher extends React.PureComponent<DimensionsSwitcherProps> {
	static defaultProps: Partial<DimensionsSwitcherProps> = {
		minItems: 1,
		maxItems: 2
	}

	render() {
		this.validateProps()

		const labelFactory: React.ReactNode =
			'labelField' in this.props ? <FieldText name={this.props.labelField} /> : this.props.children

		const metadata = QueryLanguage.wrapQualifiedEntityList(this.props.options, labelFactory, new Environment())

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
					labelFactory: labelFactory,
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
		const [isAdding, setIsAdding] = React.useState(false)
		const [isOpen, setIsOpen] = React.useState(false)

		const toggleIsOpen = React.useCallback(() => setIsOpen(!isOpen), [isOpen])
		const startAdding = React.useCallback(() => setIsAdding(true), [])

		const renderSelected = (dimensionData: StatefulDimensionDatum[]): React.ReactNode => {
			const normalizedSelected = dimensionData.filter((item): item is StatefulDimensionDatum<true> => item.isSelected)
			const renderer = props.renderSelected || renderByJoining

			return renderer(normalizedSelected)
		}

		const renderContent = (dimensionData: StatefulDimensionDatum[], selectedDimensions: string[]) => {
			const selectedDimensionsCount = selectedDimensions.length
			const canSelectAnother = selectedDimensionsCount < props.maxItems
			const columnCount = selectedDimensionsCount + (isAdding && canSelectAnother ? 1 : 0)
			const getRequestChangeCallback = (i: number, dimension: StatefulDimensionDatum): RequestChange => reqState => {
				if (reqState.name !== 'project_page') {
					return reqState
				}
				const dimensionName = props.dimension
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
						[dimensionName]: getUniqueDimensions(dimensions)
					}
				}
			}

			return (
				<Dropdown columns>
					{[...Array(columnCount)].map((_, i) => (
						<Dropdown.Column key={i}>
							{dimensionData.map(dimension => (
								<Link
									key={dimension.slug}
									Component={({ href, onClick }) => (
										<Dropdown.Item {...{ href, onClick, active: selectedDimensions[i] === dimension.slug }}>
											{dimension.label}
										</Dropdown.Item>
									)}
									requestChange={getRequestChangeCallback(i, dimension)}
								/>
							))}
						</Dropdown.Column>
					))}
					{!isAdding && canSelectAnother && (
						<Button onClick={startAdding} small>
							Add
						</Button>
					)}
				</Dropdown>
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

		const uniqueDimensions = getUniqueDimensions(environment.getAllDimensions()[props.dimension] || [])
		const normalizedData = getNormalizedData(uniqueDimensions, props.data)

		return (
			<Manager>
				<Reference>
					{({ ref }) => (
						<Button ref={ref} onClick={toggleIsOpen}>
							{renderSelected(normalizedData)}
						</Button>
					)}
				</Reference>
				{isOpen && (
					<Portal>
						<Popper placement="auto">
							{({ ref, style, placement, arrowProps }) => (
								<div ref={ref} style={{ ...style, zIndex: 20 }} data-placement={placement}>
									{renderContent(normalizedData, uniqueDimensions)}
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
