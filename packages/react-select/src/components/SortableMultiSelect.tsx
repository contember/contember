import React, { ReactNode, useCallback, useMemo } from 'react'
import { SelectCurrentEntitiesContext, SelectHandler, SelectHandleSelectContext, SelectIsSelectedContext, SelectOptionsContext } from '../contexts'
import { EntityAccessor, SugaredQualifiedEntityList, SugaredRelativeEntityList, SugaredRelativeSingleEntity, SugaredRelativeSingleField } from '@contember/binding'
import { Component, HasOne, useEntityList } from '@contember/react-binding'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { Repeater } from '@contember/react-repeater'
import { SelectEvents } from '../types'

export type SortableMultiSelectProps =
	& {
		children: ReactNode
		field: SugaredRelativeEntityList['field']
		options: SugaredQualifiedEntityList['entities']
		sortableBy: SugaredRelativeSingleField['field']
		connectAt: SugaredRelativeSingleEntity['field']
	}
	& SelectEvents

export const SortableMultiSelect = Component(({ field, children, sortableBy, connectAt, options, onSelect, onUnselect }: SortableMultiSelectProps) => {
	const list = useEntityList({ field })
	const entitiesArr = useMemo(() => Array.from(list), [list])

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
							{children}
						</SelectOptionsContext.Provider>
					</SelectHandleSelectContext.Provider>
				</SelectIsSelectedContext.Provider>
			</SelectCurrentEntitiesContext.Provider>
		</Repeater>
	)
}, ({ children, field, sortableBy, connectAt }) => {
	return (
		<Repeater field={field} sortableBy={sortableBy} initialEntityCount={0}>
			<HasOne field={connectAt}>
				{children}
			</HasOne>
		</Repeater>
	)
})

