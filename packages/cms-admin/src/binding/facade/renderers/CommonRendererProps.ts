import * as React from 'react'
import { DataRendererProps } from '../../coreComponents'

export interface CommonRendererProps {
	title?: React.ReactNode
	beforeContent?: React.ReactNode
	side?: React.ReactNode
	children?: React.ReactNode
	onlyOneInCollection?: boolean
}

export interface RendererProps extends CommonRendererProps, DataRendererProps {}
