import type { ReactNode } from 'react'
import { Component } from '../coreComponents'

export interface StaticRenderProps {
	children?: ReactNode
}

/**
 * @group Data binding
 */
export const StaticRender = Component<StaticRenderProps>(
	() => null,
	({ children }) => <>{children}</>,
	'StaticRender',
)
