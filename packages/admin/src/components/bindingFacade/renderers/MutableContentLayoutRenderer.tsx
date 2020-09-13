import * as React from 'react'
import { Component } from '@contember/binding'
import { PersistButton } from '../buttons'
import { ImmutableContentLayoutRenderer, ImmutableContentLayoutRendererProps } from './ImmutableContentLayoutRenderer'

export interface MutableContentLayoutRendererProps extends ImmutableContentLayoutRendererProps {
	persistButtonComponent?: React.ComponentType
}

export const MutableContentLayoutRenderer = Component<MutableContentLayoutRendererProps>(
	({ persistButtonComponent, side, children, ...immutableProps }) => {
		const PersistComponent = persistButtonComponent || PersistButton
		const augmentedSide = React.useMemo(
			() => (
				<>
					{side}
					<PersistComponent />
				</>
			),
			[PersistComponent, side],
		)
		return (
			<ImmutableContentLayoutRenderer {...immutableProps} side={augmentedSide}>
				{children}
			</ImmutableContentLayoutRenderer>
		)
	},
	({ persistButtonComponent, children, ...immutableProps }) => {
		const PersistComponent = persistButtonComponent || PersistButton
		return (
			<ImmutableContentLayoutRenderer {...immutableProps}>
				{children}
				<PersistComponent />
			</ImmutableContentLayoutRenderer>
		)
	},
	'MutableContentLayoutRenderer',
)
