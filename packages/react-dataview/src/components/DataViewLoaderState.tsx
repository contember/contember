import React, { ReactNode } from 'react'
import { useDataViewLoaderState } from '../contexts'

export interface DataViewLoaderStateProps {
	children: ReactNode
	loaded?: boolean
	refreshing?: boolean
	initial?: boolean
	failed?: boolean
}

export const DataViewLoaderState = ({ children, ...props }: DataViewLoaderStateProps) => {
	const state = useDataViewLoaderState()
	return props[state] ? <>{children}</> : null
}
