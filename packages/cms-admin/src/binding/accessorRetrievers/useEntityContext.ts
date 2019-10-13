import * as React from 'react'
import { DataBindingError, EntityAccessor } from '../dao'
import { AccessorContext } from './AccessorContext'

export const useEntityContext = (): EntityAccessor => {
	const data = React.useContext(AccessorContext)

	if (!(data instanceof EntityAccessor)) {
		throw new DataBindingError(`Corrupted data`)
	}
	return data
}
