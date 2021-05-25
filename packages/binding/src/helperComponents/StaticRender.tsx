import type { ReactNode } from 'react'
import { Component } from '../coreComponents'

export interface StaticRenderProps {
	children?: ReactNode
}

export const StaticRender = Component<StaticRenderProps>(
	() => null,
	({ children }) => <>{children}</>,
	'StaticRender',
)
