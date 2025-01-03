import { Component } from '@contember/interface'
import * as React from 'react'
import { ReactNode } from 'react'

/**
 * @internal
 */
export interface DataGridColumnLeafProps {
	header?: ReactNode
	cell: ReactNode
	name?: string
}

/**
 * @internal
 */
export const DataGridColumnLeaf = Component<DataGridColumnLeafProps>(() => {
	throw new Error('DataGridColumnLeaf is not supposed to be rendered')
}, ({ header, cell }) => {
	return <>{header}{cell}</>
})
