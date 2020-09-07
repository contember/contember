import { TreeFilter } from '@contember/client'
import * as React from 'react'
import { BindingError } from '../BindingError'

export const defaultGetTreeFilters = () => {
	throw new BindingError(
		`Trying to tree filters but data binding is unavailable. You likely used a bound component outside ` +
			`<DataBindingProvider /> or it tried to reach its accessor whilst the tree was in an non-interactive state ` +
			`(e.g. still loading).`,
	)
}

export const GetTreeFiltersContext = React.createContext<() => TreeFilter[]>(defaultGetTreeFilters)
GetTreeFiltersContext.displayName = 'GetTreeFiltersContext'
