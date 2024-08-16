import React, { ReactNode, useCallback, useMemo } from 'react'
import { SelectCurrentEntitiesContext, SelectHandler, SelectHandleSelectContext, SelectIsSelectedContext, SelectOptionsContext } from '../contexts'
import { Component, EntityAccessor, HasMany, SugaredQualifiedEntityList, SugaredRelativeEntityList, useEntityList } from '@contember/react-binding'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { SelectEvents } from '../types'

export type MultiSelectProps =
	& {
		children: ReactNode
		field: SugaredRelativeEntityList['field']
		options?: SugaredQualifiedEntityList['entities']
	}
	& SelectEvents

export const MultiSelect = Component(({ field, children, options, onSelect, onUnselect }: MultiSelectProps) => {
	const entities = useEntityList({ field })
	options ??= entities.name
	const entitiesArr = useMemo(() => Array.from(entities), [entities])
	const selectedEntities = useMemo(() => Array.from(entities).map(it => it.id), [entities])

	const handler = useReferentiallyStableCallback<SelectHandler>((entity, action = 'toggle') => {
		const isSelected = selectedEntities.includes(entity.id)
		if (action === 'toggle') {
			action = isSelected ? 'unselect' : 'select'
		}
		if (action === 'unselect' && isSelected) {
			entities.disconnectEntity(entity)
			onUnselect?.(entity)
		} else if (action === 'select' && !isSelected) {
			entities.connectEntity(entity)
			onSelect?.(entity)
		}
	})
	const isSelected = useCallback((entity: EntityAccessor) => {
		return selectedEntities.includes(entity.id)
	}, [selectedEntities])

	return (
		<SelectCurrentEntitiesContext.Provider value={entitiesArr}>
			<SelectIsSelectedContext.Provider value={isSelected}>
				<SelectHandleSelectContext.Provider value={handler}>
					<SelectOptionsContext.Provider value={options}>
						{children}
					</SelectOptionsContext.Provider>
				</SelectHandleSelectContext.Provider>
			</SelectIsSelectedContext.Provider>
		</SelectCurrentEntitiesContext.Provider>
	)
}, ({ field, children }) => {
	return (
		<HasMany field={field} expectedMutation="connectOrDisconnect">
			{children}
		</HasMany>
	)
})

