import { Component, EntityAccessor, EntityListAccessor, Field, SingleEntity, useEnvironment } from '@contember/binding'
import { Button, ButtonBasedButtonProps, ButtonGroup, Dropdown, Spinner } from '@contember/ui'
import * as React from 'react'
import { RequestChange } from '../../../../state/request'
import { Link } from '../../../Link'
import { useRedirect } from '../../../pageRouting'
import { Checkbox } from '../../../ui'
import { renderByJoining } from './renderByJoining'
import { SelectedDimensionRenderer, StatefulDimensionDatum } from './types'

export interface DimensionsRendererProps {
	accessor: EntityListAccessor
	buttonProps?: ButtonBasedButtonProps
	dimension: string
	labelFactory: React.ReactNode
	maxItems: number
	minItems: number
	renderSelected?: SelectedDimensionRenderer
	slugField: string
}

export function DimensionsRenderer(props: DimensionsRendererProps) {
	const environment = useEnvironment()
	const redirect = useRedirect()

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

		const renderedDimensions = dimensionData.map(dimension => {
			if (canSelectJustOne) {
				return (
					<Link
						key={dimension.slug}
						requestChange={getRequestChangeCallback(dimension)}
						Component={({ href, onClick }) => (
							<Button
								Component="a"
								href={href}
								flow="block"
								distinction="seamless"
								isActive={dimension.isSelected}
								onClick={onClick}
							>
								{dimension.label}
							</Button>
						)}
					/>
				)
			} else {
				return (
					<Checkbox
						key={dimension.slug}
						checked={dimension.isSelected}
						readOnly={dimension.isSelected && !canSelectLess}
						onChange={() => redirect(getRequestChangeCallback(dimension))}
					>
						{dimension.label}
					</Checkbox>
				)
			}
		})

		if (canSelectJustOne) {
			return <ButtonGroup orientation="vertical">{renderedDimensions}</ButtonGroup>
		}
		return <React.Fragment key="multipleDimensions">{renderedDimensions}</React.Fragment>
	}

	const getNormalizedData = (currentDimensions: string[], accessor: EntityListAccessor): StatefulDimensionDatum[] => {
		const entities = Array.from(accessor)
		const normalized: StatefulDimensionDatum[] = []

		for (const entity of entities) {
			if (!(entity instanceof EntityAccessor)) {
				continue
			}
			const slugField = entity.getField(props.slugField)
			if (typeof slugField.currentValue === 'string') {
				const slugValue = slugField.currentValue
				normalized.push({
					slug: slugValue,
					isSelected: currentDimensions.indexOf(slugValue) !== -1,
					label: <SingleEntity accessor={entity}>{props.labelFactory}</SingleEntity>,
				})
			}
		}

		return normalized
	}

	const getUniqueDimensions = (selectedDimensions: string[]): string[] => {
		return selectedDimensions.filter((item, i, array) => array.indexOf(item) === i)
	}

	const uniqueDimensions = getUniqueDimensions(environment.getDimension(props.dimension) || [])
	const normalizedData = getNormalizedData(uniqueDimensions, props.accessor)

	const selectedDimensions = normalizedData
		? uniqueDimensions
				.filter(slug => normalizedData.find(item => item.slug === slug) !== undefined)
				.map(dimension => normalizedData.find(item => item.slug === dimension))
				.filter((item): item is StatefulDimensionDatum<true> => !!item && item.isSelected)
		: []

	React.useEffect(() => {
		const redirectTarget = selectedDimensions.length === 0 ? normalizedData || [] : selectedDimensions

		if (normalizedData !== undefined && selectedDimensions.length === 0 && redirectTarget.length > 0) {
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
		<Dropdown
			buttonProps={{
				...props.buttonProps,
				children: renderSelected(selectedDimensions),
			}}
		>
			{renderContent(normalizedData, selectedDimensions)}
		</Dropdown>
	)
}
