import * as React from 'react'
import { EntityAccessor } from '../accessors'
import { DataBindingError } from '../dao'
import { AccessorContext } from './AccessorContext'

export const useEntityContext = (): EntityAccessor => {
	const data = React.useContext(AccessorContext)

	if (!(data instanceof EntityAccessor)) {
		throw new DataBindingError(
			`Trying to use a data bound component outside a correct parent. Perhaps you forgot to use a data provider?`,
		)
	}
	return data
}
