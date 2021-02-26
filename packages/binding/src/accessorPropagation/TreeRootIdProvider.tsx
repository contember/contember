import * as React from 'react'
import { TreeRootId } from '../treeParameters'
import { TreeRootIdContext } from './TreeRootIdContext'

export interface TreeRootIdProviderProps {
	treeRootId: TreeRootId | undefined
	children: React.ReactNode
}

export function TreeRootIdProvider(props: TreeRootIdProviderProps) {
	return <TreeRootIdContext.Provider value={props.treeRootId}>{props.children}</TreeRootIdContext.Provider>
}
