import * as React from 'react'
import { ReactElement } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewLoaderState, useDataViewReload } from '../contexts'


export interface DataViewReloadTriggerProps {
	children: ReactElement
}

export const DataViewReloadTrigger = ({ children }: DataViewReloadTriggerProps) => {
	const reload = useDataViewReload()
	const state = useDataViewLoaderState()
	return (
		<Slot onClick={reload} data-state={state}>
			{children}
		</Slot>
	)
}
