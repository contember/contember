import * as React from 'react'
import { GetEntityByKey } from '../accessors'
import { BindingError } from '../BindingError'

export const defaultGetEntityByKey: GetEntityByKey = () => {
	throw new BindingError(
		`Trying to retrieve an entity but data binding is unavailable. You likely used a bound component outside ` +
			`<DataBindingProvider /> or it tried to reach its accessor whilst the tree was in an non-interactive state ` +
			`(e.g. still loading).`,
	)
}

export const GetEntityByKeyContext = React.createContext<GetEntityByKey>(defaultGetEntityByKey)
GetEntityByKeyContext.displayName = 'GetEntityByKeyContext'
