import * as React from 'react'
import {
	AccessorTreeRoot,
	EntityAccessor,
	EntityCollectionAccessor,
	EntityForRemovalAccessor,
	Errorable,
	FieldAccessor,
	ReferenceMarker,
} from '../dao'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { ToMany } from './ToMany'
import { ToOne } from './ToOne'

export type DataContextValue = undefined | FieldAccessor | EntityAccessor | AccessorTreeRoot | EntityForRemovalAccessor

type _EntityAccessorErrorable = EnforceSubtypeRelation<EntityAccessor, Errorable>
type _FieldAccessorErrorable = EnforceSubtypeRelation<FieldAccessor, Errorable>

export const DataContext = React.createContext<DataContextValue>(undefined)

export const useEntityAccessor = ({ field, filter, reducedBy }: ToOne.AtomicPrimitiveProps) => {
	const data = React.useContext(DataContext)

	if (!(data instanceof EntityAccessor)) {
		return undefined
	}
	const desiredField = data.data.getField(field, ReferenceMarker.ExpectedCount.UpToOne, filter, reducedBy)

	if (!(desiredField instanceof EntityAccessor)) {
		return undefined
	}
	return desiredField
}

export const useEntityCollectionAccessor = ({ field, filter }: ToMany.AtomicPrimitiveProps) => {
	const data = React.useContext(DataContext)

	if (!(data instanceof EntityAccessor)) {
		return undefined
	}
	const desiredField = data.data.getField(field, ReferenceMarker.ExpectedCount.PossiblyMany, filter)

	if (!(desiredField instanceof EntityCollectionAccessor)) {
		return undefined
	}
	return desiredField
}
