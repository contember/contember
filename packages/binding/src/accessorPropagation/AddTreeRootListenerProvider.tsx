import * as React from 'react'
import { TreeRootAccessor } from '../accessors'
import { AddTreeRootListenerContext, defaultAddTreeRootListener } from './AddTreeRootListenerContext'

export interface AddTreeRootListenerProviderProps {
	addTreeRootListener: TreeRootAccessor.AddTreeRootEventListener | undefined
	children: React.ReactNode
}

export function AddTreeRootListenerProvider(props: AddTreeRootListenerProviderProps) {
	return (
		<AddTreeRootListenerContext.Provider value={props.addTreeRootListener || defaultAddTreeRootListener}>
			{props.children}
		</AddTreeRootListenerContext.Provider>
	)
}
