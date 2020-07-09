import * as React from 'react'
import { TreeRootAccessor } from '../accessors'
import { BindingError } from '../BindingError'

export const defaultAddTreeRootListener: TreeRootAccessor.AddTreeRootEventListener = () => {
	throw new BindingError()
}

export const AddTreeRootListenerContext = React.createContext<TreeRootAccessor.AddTreeRootEventListener>(
	defaultAddTreeRootListener,
)
AddTreeRootListenerContext.displayName = 'AddTreeRootListenerContext'
