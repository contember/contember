import * as React from 'react'
import { EntityAccessor } from '../accessors'
import { BindingError } from '../BindingError'
import { AccessorContext } from './AccessorContext'

export const useEntityAccessor = (): EntityAccessor => {
	const data = React.useContext(AccessorContext)

	if (!(data instanceof EntityAccessor)) {
		throw new BindingError(
			`Trying to use a data bound component outside a correct parent. Perhaps you forgot to use a data provider?`,
		)
	}
	return data
}
