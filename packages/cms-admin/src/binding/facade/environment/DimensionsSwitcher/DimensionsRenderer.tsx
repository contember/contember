import * as React from 'react'
import { Button, Checkbox, Link } from '../../../../components'
import { DynamicLink } from '../../../../components/DynamicLink'
import { Dropdown } from '../../../../components/ui'
import { RequestChange } from '../../../../state/request'
import { isSpecialLinkClick } from '../../../../utils/isSpecialLinkClick'
import { EnvironmentContext, ToOne } from '../../../coreComponents'
import { AccessorTreeRoot, EntityAccessor, EntityCollectionAccessor, FieldAccessor } from '../../../dao'
import { RendererProps } from '../../renderers'
import { renderByJoining } from './renderByJoining'
import { DimensionDatum, SelectedDimensionRenderer, StatefulDimensionDatum } from './types'

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
			<Dropdown>
				{dimensionData.map(dimension => (
					<Dropdown.Item key={dimension.slug} active={dimension.isSelected}>
						{canSelectJustOne && (
							<Link
								requestChange={getRequestChangeCallback(dimension)}
								Component={({ href, onClick }) => (
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
								)}
							/>
						)}
						{!canSelectJustOne && (
							<DynamicLink
								requestChange={getRequestChangeCallback(dimension)}
								Component={({ onClick }) => (
									<Checkbox
										key={dimension.slug}
										checked={dimension.isSelected}
										label={dimension.label}
										readOnly={dimension.isSelected && !canSelectLess}
										onChange={() => onClick()}
									/>
								)}
							/>
						)}
					</Dropdown.Item>
				))}
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

	const uniqueDimensions = getUniqueDimensions(environment.getDimension(props.dimension) || [])
	const normalizedData = getNormalizedData(uniqueDimensions, props.data)
	const selectedDimensions = uniqueDimensions
		.map(dimension => normalizedData.find(item => item.slug === dimension))
		.filter((item): item is StatefulDimensionDatum<true> => !!item && item.isSelected)

	if (normalizedData.length === 1) {
		// If there is just one alternative to choose from, render no drop-downs
		return <div className="dimensionsSwitcher-staticSelected">{renderSelected(selectedDimensions)}</div>
	}

	return (
		<div className="dimensionsSwitcher">
			<Button onClick={toggleIsOpen} className="dimensionsSwitcher-button">
				{renderSelected(selectedDimensions)}
			</Button>
			{isOpen && <div className="dimensionsSwitcher-content">{renderContent(normalizedData, selectedDimensions)}</div>}
		</div>
	)
}
