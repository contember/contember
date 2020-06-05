import * as React from 'react'
import { GetSubTree } from '../accessors'
import { defaultGetSubTree, GetSubTreeContext } from './GetSubTreeContext'

export interface GetSubTreeProviderProviderProps {
	getSubTree: GetSubTree | undefined
	children: React.ReactNode
}

export function GetSubTreeProvider(props: GetSubTreeProviderProviderProps) {
	return (
		<GetSubTreeContext.Provider value={props.getSubTree || defaultGetSubTree}>
			{props.children}
		</GetSubTreeContext.Provider>
	)
}
