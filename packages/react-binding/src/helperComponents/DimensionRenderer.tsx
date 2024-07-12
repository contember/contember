import * as React from 'react'
import { ReactNode } from 'react'
import { EnvironmentMiddleware } from '../accessorPropagation'
import { Component } from '../coreComponents'

export type DimensionRendererProps = {
	dimension: string
	as: string
	children: ReactNode
}

export const DimensionRenderer = Component<DimensionRendererProps>(({ dimension, as, children }, env) => {
	const dimensions = env.getDimensionOrElse(dimension, [])

	return <>
		{dimensions.map(value => (
			<EnvironmentMiddleware
				create={it => it.withVariables({ [as]: value })}
				key={value}
			>
				{children}
			</EnvironmentMiddleware>
		))}
	</>
})
