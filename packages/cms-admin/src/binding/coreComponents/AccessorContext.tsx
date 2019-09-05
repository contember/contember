import { Input } from '@contember/schema'
import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { FieldName, Filter } from '../bindingTypes'
import {
	DataBindingError,
	EntityAccessor,
	EntityCollectionAccessor,
	EntityForRemovalAccessor,
	ReferenceMarker,
} from '../dao'

export type AccessorContextValue = undefined | EntityAccessor | EntityForRemovalAccessor

export const AccessorContext = React.createContext<AccessorContextValue>(undefined)

export const useEntityContext = (): EntityAccessor => {
	const data = React.useContext(AccessorContext)

	if (!(data instanceof EntityAccessor)) {
		throw new DataBindingError(`Corrupted data`)
	}
	return data
}

export const useEntityAccessor = (
	field: FieldName,
	filter?: Filter,
	reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>,
) => {
	const data = useEntityContext()
	const desiredField = data.data.getField(field, ReferenceMarker.ExpectedCount.UpToOne, filter, reducedBy)

	if (!(desiredField instanceof EntityAccessor)) {
		return undefined
	}
	return desiredField
}

export const useEntityCollectionAccessor = (field: FieldName, filter?: Filter) => {
	const data = useEntityContext()
	const desiredField = data.data.getField(field, ReferenceMarker.ExpectedCount.PossiblyMany, filter)

	if (!(desiredField instanceof EntityCollectionAccessor)) {
		return undefined
	}
	return desiredField
}
