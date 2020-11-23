import * as React from 'react'
import { BindingOperations } from '../accessors'
import { BindingError } from '../BindingError'

const getRejecter = (operation: string) => () => {
	throw new BindingError(
		`Trying to ${operation} but data binding is unavailable. You likely used a bound component outside ` +
			`<DataBindingProvider /> or it tried to reach its accessor whilst the tree was in an non-interactive state ` +
			`(e.g. still loading).`,
	)
}

export const defaultBindingOperations = Object.freeze<BindingOperations>({
	getEntityListSubTree: getRejecter('retrieve an entity list sub tree'),
	getEntitySubTree: getRejecter('retrieve a single entity sub tree'),
	getAllEntities: getRejecter('retrieve all entities'),
	getEntityByKey: getRejecter('retrieve an entity by key'),
	getTreeFilters: getRejecter('retrieve tree filters'),
	batchDeferredUpdates: getRejecter('batch deferred updates'),
	persistAll: getRejecter('persist all'),
})

export const BindingOperationsContext = React.createContext<BindingOperations>(defaultBindingOperations)
