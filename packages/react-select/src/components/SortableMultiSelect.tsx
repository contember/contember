import React, { ReactNode, useCallback, useMemo } from 'react'
import { SelectCurrentEntitiesContext, SelectHandler, SelectHandleSelectContext, SelectIsSelectedContext, SelectOptionsContext, SelectOptionsFilterContext } from '../contexts'
import { Component, EntityAccessor, HasOne, PlaceholderGenerator, QueryLanguage, SugaredQualifiedEntityList, SugaredRelativeEntityList, SugaredRelativeSingleEntity, SugaredRelativeSingleField, useEntityList } from '@contember/react-binding'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { Repeater } from '@contember/react-repeater'
import { SelectEvents } from '../types'
import { SelectFilterFieldProps, useSelectFilter } from '../hooks'
import { FieldMarker, MeaningfulMarker } from '@contember/binding'

export type SortableMultiSelectProps =
	& {
		children: ReactNode
		field: SugaredRelativeEntityList['field']
		options?: SugaredQualifiedEntityList['entities']
		sortableBy: SugaredRelativeSingleField['field']
		connectAt: SugaredRelativeSingleEntity['field']
	}
	& SelectFilterFieldProps
	& SelectEvents

export const SortableMultiSelect = Component(({ field, children, sortableBy, connectAt, options, onSelect, onUnselect, filterField }: SortableMultiSelectProps) => {
	const list = useEntityList({ field })
	const entitiesArr = useMemo(() => Array.from(list), [list])

	const optionsMarker = useMemo(() => {
		const desugared = QueryLanguage.desugarRelativeSingleEntity({ field: connectAt }, list.environment)
		let marker: Exclude<MeaningfulMarker, FieldMarker> = list.getMarker()
		for (let relation of desugared.hasOneRelationPath) {
			const placeholder = PlaceholderGenerator.getHasOneRelationPlaceholder(relation)
			const relationMarker = marker.fields.markers.get(placeholder)
			if (!relationMarker || relationMarker instanceof FieldMarker) {
				throw new Error('Invalid marker')
			}
			marker = relationMarker
		}
		return marker
	}, [connectAt, list])

	options ??= optionsMarker.environment.getSubTreeNode().entity.name

	const filter = useSelectFilter({ filterField, marker: optionsMarker })

	const selectedEntities = useMemo(() => Array.from(list).map(it => it.getEntity({ field: connectAt }).id), [connectAt, list])

	const handler = useReferentiallyStableCallback<SelectHandler>((entity, action = 'toggle') => {
		const isSelected = selectedEntities.includes(entity.id)
		if (action === 'toggle') {
			action = isSelected ? 'unselect' : 'select'
		}
		if (action === 'unselect' && isSelected) {
			Array.from(list).find(it => it.getEntity({ field: connectAt }).id === entity.id)?.deleteEntity()
			onUnselect?.(entity)
		} else if (action === 'select' && !isSelected) {
			list.createNewEntity(getEntity => {
				getEntity().connectEntityAtField({ field: connectAt }, entity)
				onSelect?.(entity)
			})
		}
	})
	const isSelected = useCallback((entity: EntityAccessor) => {
		return selectedEntities.includes(entity.id)
	}, [selectedEntities])

	return (
		<Repeater field={field} sortableBy={sortableBy} initialEntityCount={0}>
			<SelectCurrentEntitiesContext.Provider value={entitiesArr}>
				<SelectIsSelectedContext.Provider value={isSelected}>
					<SelectHandleSelectContext.Provider value={handler}>
						<SelectOptionsContext.Provider value={options}>
							<SelectOptionsFilterContext.Provider value={filter}>
								{children}
							</SelectOptionsFilterContext.Provider>
						</SelectOptionsContext.Provider>
					</SelectHandleSelectContext.Provider>
				</SelectIsSelectedContext.Provider>
			</SelectCurrentEntitiesContext.Provider>
		</Repeater>
	)
}, ({ children, field, sortableBy, connectAt }) => {
	return (
		<Repeater field={field} sortableBy={sortableBy} initialEntityCount={0}>
			<HasOne field={connectAt} expectedMutation="connectOrDisconnect">
				{children}
			</HasOne>
		</Repeater>
	)
})

