import { Entity, EntityAccessor, EntityListAccessor, useEnvironment } from '@contember/binding'
import { emptyArray } from '@contember/react-utils'
import { AnchorButton, ButtonGroup, ButtonProps, Checkbox, Dropdown, DropdownProps, FieldContainer, Stack } from '@contember/ui'
import { ReactNode, useCallback, useEffect, useMemo } from 'react'
import type { RequestChange } from '../../../../routing'
import { RoutingLink, useRedirect } from '../../../../routing'
import { renderByJoining } from './renderByJoining'
import type { SelectedDimensionRenderer, StatefulDimensionDatum } from './types'

export interface DimensionsRendererProps {
	accessor: EntityListAccessor
	buttonProps?: ButtonProps
	dimension: string
	labelFactory: ReactNode
	maxItems: number
	minItems: number
	renderSelected?: SelectedDimensionRenderer
	slugField: string
}

export function DimensionsRenderer(props: DimensionsRendererProps) {
	const environment = useEnvironment()
	const redirect = useRedirect()

	const renderSelected = useCallback((selectedDimensions: StatefulDimensionDatum<true>[]): ReactNode => {
		const renderer = props.renderSelected || renderByJoining

		return renderer(selectedDimensions)
	}, [props.renderSelected])

	const renderContent = (
		dimensionData: StatefulDimensionDatum[],
		selectedDimensions: StatefulDimensionDatum<true>[],
	) => {
		const canSelectJustOne = props.minItems === 1 && props.maxItems === 1
		const selectedDimensionsCount = selectedDimensions.length
		const canSelectAnother = selectedDimensionsCount < props.maxItems
		const canSelectLess = selectedDimensionsCount > props.minItems
		const getRequestChangeCallback =
			(dimension: StatefulDimensionDatum): RequestChange =>
				reqState => {
					if (reqState === null) {
						throw 'Cannot switch dimension of unmatched request'
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
					<RoutingLink
						key={dimension.slug}
						to={getRequestChangeCallback(dimension)}
						Component={({ href, onClick }) => (
							<AnchorButton
								href={href}
								display="block"
								active={dimension.isSelected}
								onClick={onClick}
							>
								{dimension.label}
							</AnchorButton>
						)}
					/>
				)
			} else {
				return (
					<FieldContainer
						key={dimension.slug}
						display="inline"
						label={dimension.label}
						labelPosition="right"
					>
						<Checkbox
							key={dimension.slug}
							value={dimension.isSelected}
							disabled={dimension.isSelected && !canSelectLess}
							onChange={() => redirect(getRequestChangeCallback(dimension))}
						/>
					</FieldContainer>
				)
			}
		})

		if (canSelectJustOne) {
			return <ButtonGroup direction="vertical" display="block" inset="border">{renderedDimensions}</ButtonGroup>
		}

		return (
			<Stack gap="large" key="multipleDimensions">
				{renderedDimensions}
			</Stack>
		)
	}

	const getNormalizedData = (currentDimensions: string[], accessor: EntityListAccessor): StatefulDimensionDatum[] => {
		const entities = Array.from(accessor)
		const normalized: StatefulDimensionDatum[] = []

		for (const entity of entities) {
			if (!(entity instanceof EntityAccessor)) {
				continue
			}
			const slugField = entity.getField(props.slugField)
			if (typeof slugField.value === 'string') {
				const slugValue = slugField.value
				normalized.push({
					slug: slugValue,
					isSelected: currentDimensions.indexOf(slugValue) !== -1,
					label: <Entity accessor={entity}>{props.labelFactory}</Entity>,
				})
			}
		}

		return normalized
	}

	const getUniqueDimensions = (selectedDimensions: string[]): string[] => {
		return selectedDimensions.filter((item, i, array) => array.indexOf(item) === i)
	}

	const uniqueDimensions = getUniqueDimensions(environment.getDimensionOrElse(props.dimension, []))
	const normalizedData = getNormalizedData(uniqueDimensions, props.accessor)

	const selectedDimensions = normalizedData
		? uniqueDimensions
			.filter(slug => normalizedData.find(item => item.slug === slug) !== undefined)
			.map(dimension => normalizedData.find(item => item.slug === dimension))
			.filter((item): item is StatefulDimensionDatum<true> => !!item && item.isSelected)
		: emptyArray

	useEffect(() => {
		const redirectTarget = selectedDimensions.length === 0 ? normalizedData || [] : selectedDimensions

		if (normalizedData !== undefined && selectedDimensions.length === 0 && redirectTarget.length > 0) {
			redirect(requestState => {
				return {
					...requestState!,
					dimensions: {
						...(requestState?.dimensions ?? {}),
						[props.dimension]: getUniqueDimensions(redirectTarget.map(item => item.slug).slice(0, props.maxItems)),
					},
				}
			})
		}
	}, [normalizedData, props.dimension, props.maxItems, redirect, selectedDimensions])

	const buttonProps: DropdownProps['buttonProps'] = useMemo(() => ({
		distinction: 'seamless',
		size: 'small',
		...props.buttonProps,
		children: renderSelected(selectedDimensions),
	}), [props.buttonProps, renderSelected, selectedDimensions])

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
		<Dropdown buttonProps={buttonProps}>
			{renderContent(normalizedData, selectedDimensions)}
		</Dropdown>
	)
}
