import React, { ReactNode, useCallback, useMemo } from 'react'
import { SelectCurrentEntitiesContext, SelectHandler, SelectHandleSelectContext, SelectIsSelectedContext, SelectOptionsContext } from '../contexts'
import { Component, EntityAccessor, HasOne, SugaredQualifiedEntityList, SugaredRelativeSingleEntity, useEntity } from '@contember/react-binding'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { SelectEvents } from '../types'

export type SelectProps =
	& {
		children: ReactNode
		field: SugaredRelativeSingleEntity['field']
		options?: SugaredQualifiedEntityList['entities']
		isNonbearing?: boolean
	}
	& SelectEvents

export const Select = Component(({ field, children, onUnselect, onSelect, options }: SelectProps) => {
	const entity = useEntity()
	const selectedEntity = entity.getEntity({ field })
	options ??= selectedEntity.name

	const entityExists = selectedEntity.existsOnServer || selectedEntity.hasUnpersistedChanges
	const entitiesArr = useMemo(() => entityExists ? [selectedEntity] : [], [entityExists, selectedEntity])

	const handleSelect = useReferentiallyStableCallback<SelectHandler>((selected, action = 'toggle') => {
		if (action === 'toggle') {
			action = selected.id === selectedEntity.id ? 'unselect' : 'select'
		}
		if (action === 'unselect') {
			entity.disconnectEntityAtField({ field })
			onUnselect?.(selected)
		} else if (action === 'select') {
			entity.connectEntityAtField({ field }, selected)
			onSelect?.(selected)
		}
	})
	const isSelected = useCallback((entity: EntityAccessor) => entity.id === selectedEntity.id, [selectedEntity.id])

	return (
		<SelectCurrentEntitiesContext.Provider value={entitiesArr}>
			<SelectIsSelectedContext.Provider value={isSelected}>
				<SelectHandleSelectContext.Provider value={handleSelect}>
					<SelectOptionsContext.Provider value={options}>
						{children}
					</SelectOptionsContext.Provider>
				</SelectHandleSelectContext.Provider>
			</SelectIsSelectedContext.Provider>
		</SelectCurrentEntitiesContext.Provider>
	)
}, ({ field, children, isNonbearing }) => {
	return (
		<HasOne field={field} expectedMutation="connectOrDisconnect" isNonbearing={isNonbearing}>
			{children}
		</HasOne>
	)
})

