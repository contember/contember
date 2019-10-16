import * as React from 'react'
import { Component } from '../../../binding'
import { PersistButton } from '../buttons'
import { ImmutableContentLayoutRenderer, ImmutableContentLayoutRendererProps } from './ImmutableContentLayoutRenderer'

export interface MutableContentLayoutRendererProps extends ImmutableContentLayoutRendererProps {
	persistButtonComponent?: React.ComponentType
}

export const MutableContentLayoutRenderer = Component<MutableContentLayoutRendererProps>(
	({ persistButtonComponent: PersistComponent = PersistButton, side, children, ...immutableProps }) => {
		const augmentedSide = React.useMemo(
			() => (
				<>
					{side}
					<PersistComponent />
				</>
			),
			[side],
		)
		return (
			<ImmutableContentLayoutRenderer {...immutableProps} side={augmentedSide}>
				{children}
			</ImmutableContentLayoutRenderer>
		)
	},
	({ persistButtonComponent, ...immutableProps }) => (
		<ImmutableContentLayoutRenderer {...immutableProps}>{persistButtonComponent}</ImmutableContentLayoutRenderer>
	),
	'MutableContentLayoutRenderer',
)
