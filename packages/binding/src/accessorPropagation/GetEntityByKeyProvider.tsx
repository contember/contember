import * as React from 'react'
import { GetEntityByKey } from '../accessors'
import { defaultGetEntityByKey, GetEntityByKeyContext } from './GetEntityByKeyContext'

export interface GetEntityByKeyContextProviderProps {
	getEntityByKey: GetEntityByKey | undefined
	children: React.ReactNode
}

export function GetEntityByKeyProvider(props: GetEntityByKeyContextProviderProps) {
	return (
		<GetEntityByKeyContext.Provider value={props.getEntityByKey || defaultGetEntityByKey}>
			{props.children}
		</GetEntityByKeyContext.Provider>
	)
}
