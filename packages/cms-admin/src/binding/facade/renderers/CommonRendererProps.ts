import { TitleBarProps } from '@contember/ui'
import * as React from 'react'

export interface TitleBarRendererProps extends Omit<TitleBarProps, 'children'> {
	title?: React.ReactNode
}

export interface CommonRendererProps extends TitleBarRendererProps {
	beforeContent?: React.ReactNode
	side?: React.ReactNode
	children?: React.ReactNode
	onlyOneInCollection?: boolean
}

export interface RendererProps extends CommonRendererProps {}
