import * as React from 'react'
import { Component } from '../coreComponents'

export interface StaticRenderProps {
	children?: React.ReactNode
}

export const StaticRender = Component<StaticRenderProps>(
	() => null,
	({ children }) => <>{children}</>,
	'StaticRender',
)
