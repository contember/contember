import * as React from 'react'
import { GetEntityByKey } from '../accessors'
import { GetEntityByKeyContext } from './GetEntityByKeyContext'

export interface GetEntityByKeyContextProviderProps {
	getEntityByKey: GetEntityByKey
	children: React.ReactNode
}

export function GetEntityByKeyProvider(props: GetEntityByKeyContextProviderProps) {
	return <GetEntityByKeyContext.Provider value={props.getEntityByKey}>{props.children}</GetEntityByKeyContext.Provider>
}
