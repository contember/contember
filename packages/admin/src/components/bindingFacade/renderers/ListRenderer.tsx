import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import { ImmutableContentLayoutRenderer, ImmutableContentLayoutRendererProps } from './ImmutableContentLayoutRenderer'
import { ImmutableEntityListRenderer, ImmutableEntityListRendererProps } from './ImmutableEntityListRenderer'

export interface ListRendererProps<ContainerExtraProps, ItemExtraProps>
	extends ImmutableContentLayoutRendererProps,
		ImmutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps> {}

export const ListRenderer = Component(
	<ContainerExtraProps, ItemExtraProps>({
		children,

		side,
		title,
		navigation,
		headingProps,
		actions,

		...entityListProps
	}: ListRendererProps<ContainerExtraProps, ItemExtraProps>) => (
		<ImmutableContentLayoutRenderer
			side={side}
			title={title}
			navigation={navigation}
			actions={actions}
			headingProps={headingProps}
		>
			<ImmutableEntityListRenderer {...entityListProps}>{children}</ImmutableEntityListRenderer>
		</ImmutableContentLayoutRenderer>
	),
	'ListRenderer',
) as <ContainerExtraProps, ItemExtraProps>(
	props: ListRendererProps<ContainerExtraProps, ItemExtraProps>,
) => ReactElement
