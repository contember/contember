import { Component, Entity, EntityAccessor } from '@contember/binding'
import {
	ReactNode,
	ComponentType,
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
	FC,
	FunctionComponent,
	Fragment,
	PureComponent,
	useEffect,
} from 'react'
import { MutableContentLayoutRenderer, MutableContentLayoutRendererProps } from './MutableContentLayoutRenderer'

export interface MutableSingleEntityRendererProps extends MutableContentLayoutRendererProps {
	accessor: EntityAccessor
}

export const MutableSingleEntityRenderer: FunctionComponent<MutableSingleEntityRendererProps> = Component(
	({ accessor, children, ...contentLayoutProps }) => (
		<Entity accessor={accessor}>
			<MutableContentLayoutRenderer {...contentLayoutProps}>{children}</MutableContentLayoutRenderer>
		</Entity>
	),
	'MutableSingleEntityRenderer',
)
