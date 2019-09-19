import * as React from 'react'
import { AccessorContext } from '../coreComponents'
import { DataBindingError, EntityAccessor } from '../dao'

export const useEntityContext = (): EntityAccessor => {
	const data = React.useContext(AccessorContext)

	if (!(data instanceof EntityAccessor)) {
		throw new DataBindingError(`Corrupted data`)
	}
	return data
}
