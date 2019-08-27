import { Button, ButtonProps, Spinner, Dropdown2 } from '@contember/ui'
import * as React from 'react'
import { Checkbox, Link, useRedirect } from '../../../../components'
import { RequestChange } from '../../../../state/request'
import { isSpecialLinkClick } from '../../../../utils/isSpecialLinkClick'
import { EnvironmentContext, ToOne } from '../../../coreComponents'
import { AccessorTreeRoot, EntityAccessor, EntityCollectionAccessor, FieldAccessor } from '../../../dao'
import { RendererProps } from '../../renderers'
import { renderByJoining } from './renderByJoining'
import { SelectedDimensionRenderer, StatefulDimensionDatum } from './types'
import { useCallback, useState } from 'react'

export interface DimensionsRendererProps {
	buttonProps?: ButtonProps
	dimension: string
	labelFactory: React.ReactNode
	maxItems: number
	minItems: number
	renderSelected?: SelectedDimensionRenderer
	slugField: string
}

export const DimensionsRenderer = React.memo((props: RendererProps & DimensionsRendererProps) => {
	const environment = React.useContext(EnvironmentContext)
	const redirect = useRedirect()
	const [isOpen, setIsOpen] = useState(false)
	const toggleDropdownIsOpen = useCallback(() => {
		setIsOpen(!isOpen)
	}, [isOpen])
	const closeDropdown = useCallback(() => {
		setIsOpen(false)
	}, [])

	const renderSelected = (selectedDimensions: StatefulDimensionDatum<true>[]): React.ReactNode => {
		const renderer = props.renderSelected || renderByJoining

		return renderer(selectedDimensions)
	}

	const renderContent = (
		dimensionData: StatefulDimensionDatum[],
		selectedDimensions: StatefulDimensionDatum<true>[],
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
					[props.dimension]: getUniqueDimensions(updatedDimensions.map(item => item.slug).slice(0, props.maxItems)),
				},
			}
		}

		return (
			<>
				{dimensionData.map(dimension => (
					<div key={dimension.slug} /*active={dimension.isSelected}*/>
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
											onClick(e)
										}}
									>
										{dimension.label}
									</a>
								)}
							/>
						)}
						{!canSelectJustOne && (
							<Checkbox
								key={dimension.slug}
								checked={dimension.isSelected}
								readOnly={dimension.isSelected && !canSelectLess}
								onChange={() => redirect(getRequestChangeCallback(dimension))}
							>
								{dimension.label}
							</Checkbox>
						)}
					</div>
				))}
			</>
		)
	}

	const getNormalizedData = (
		currentDimensions: string[],
		data?: AccessorTreeRoot,
	): StatefulDimensionDatum[] | undefined => {
		if (!data) {
			return undefined
			/*return currentDimensions.map(dimension => {
				return {
					slug: dimension,
					label: dimension, // We don't have the data to match the defaults with so this is better than nothing
					isSelected: true,
				}
			})*/
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
						label,
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

	const selectedDimensions = normalizedData
		? uniqueDimensions
				.filter(slug => normalizedData.find(item => item.slug === slug) !== undefined)
				.map(dimension => normalizedData.find(item => item.slug === dimension))
				.filter((item): item is StatefulDimensionDatum<true> => !!item && item.isSelected)
		: []

	React.useEffect(() => {
		const redirectTarget = selectedDimensions.length === 0 ? normalizedData || [] : selectedDimensions

		if (normalizedData !== undefined && selectedDimensions.length === 0) {
			redirect(requestState => {
				if (requestState.name !== 'project_page') {
					return requestState
				}
				return {
					...requestState,
					dimensions: {
						...(requestState.dimensions || {}),
						[props.dimension]: getUniqueDimensions(redirectTarget.map(item => item.slug).slice(0, props.maxItems)),
					},
				}
			})
		}
	}, [normalizedData, props.dimension, props.maxItems, redirect, selectedDimensions])

	if (normalizedData === undefined) {
		return <Spinner />
	}

	if (normalizedData.length === 0) {
		return null // What do we even do here…?
	}

	if (normalizedData.length === 1) {
		// If there is just one alternative to choose from, render no drop-downs
		return (
			<div className="dimensionsSwitcher">
				<div className="dimensionsSwitcher-staticSelected">{renderSelected(selectedDimensions)}</div>
			</div>
		)
	}

	return (
		<Dropdown2
			handle={
				<Button {...props.buttonProps} onClick={toggleDropdownIsOpen}>
					{renderSelected(selectedDimensions)}
				</Button>
			}
			isOpen={isOpen}
			onCloseRequest={closeDropdown}
		>
			{renderContent(normalizedData, selectedDimensions)}
		</Dropdown2>
	)
})
