import { Component } from '@contember/binding'
import { ComponentType, FunctionComponent, useMemo } from 'react'
import { PersistButton } from '../buttons'
import { ImmutableContentLayoutRenderer, ImmutableContentLayoutRendererProps } from './ImmutableContentLayoutRenderer'

export interface MutableContentLayoutRendererProps extends ImmutableContentLayoutRendererProps {
	persistButtonComponent?: ComponentType
}

export const MutableContentLayoutRenderer: FunctionComponent<MutableContentLayoutRendererProps> = Component(
	({ persistButtonComponent, side, children, ...immutableProps }) => {
		const PersistComponent = persistButtonComponent || PersistButton
		const augmentedSide = useMemo(
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
