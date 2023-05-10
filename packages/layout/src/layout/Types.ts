import { NestedClassName, PolymorphicComponentPropsWithRef, isOneOfFactory } from '@contember/utilities'
import { ElementType, PropsWithChildren, RefObject } from 'react'

export const layoutPanelBehaviorsList = ['static', 'collapsible', 'overlay', 'modal'] as const
export type LayoutPanelBehavior = typeof layoutPanelBehaviorsList[number]
export const isOneOfLayoutPanelBehaviors = isOneOfFactory<LayoutPanelBehavior>(layoutPanelBehaviorsList)
export type MaybeLayoutPanelBehavior = LayoutPanelBehavior | null

export const layoutPanelVisibilityList = ['visible', 'hidden'] as const
export type LayoutPanelVisibility = typeof layoutPanelVisibilityList[number]
export const isOneOfLayoutPanelVisibilities = isOneOfFactory<LayoutPanelVisibility>(layoutPanelVisibilityList)
export type MaybeLayoutPanelVisibility = LayoutPanelVisibility | null

export const layoutParts = ['header', 'panel', 'footer'] as const
export type LayoutPart = typeof layoutParts[number]

export const layoutPanelPartsList = ['header', 'body', 'footer'] as const
export type LayoutPanelPart = typeof layoutPanelPartsList[number]

export type OwnContainerProps = PropsWithChildren<{
	className?: NestedClassName;
	componentClassName?: string;
}>

export type ContainerProps<C extends ElementType> =
	PolymorphicComponentPropsWithRef<C, OwnContainerProps>

export type ContainerComponentType = (<C extends ElementType = 'div'>(
	props: ContainerProps<C>,
) => React.ReactElement | null) & {
	displayName?: string | undefined;
}

export type LayoutPanelState = {
	behavior: LayoutPanelBehavior;
	panel: string;
	visibility: LayoutPanelVisibility;
}

export interface BasicLayoutPanelProps extends OwnContainerProps {
	trapFocusInModal?: boolean;
}

export type CommonLayoutPanelConfigProps = {
	basis: number | null | undefined;
	maxWidth?: number | null | undefined;
	minWidth?: number | null | undefined;
	name: string;
	priority?: number | null | undefined;
}

export interface ControlledLayoutPanelProps {
	behavior: LayoutPanelBehavior | null | undefined;
	defaultBehavior?: never;
	defaultVisibility?: never;
	onBehaviorChange: (state: LayoutPanelState) => void;
	onKeyPress?: (event: KeyboardEvent, state: LayoutPanelState) => void;
	onVisibilityChange: (state: LayoutPanelState) => void;
	visibility: LayoutPanelVisibility | null | undefined;
}
export interface UncontrolledLayoutPanelProps {
	behavior?: never;
	defaultBehavior: LayoutPanelBehavior | null | undefined;
	defaultVisibility: LayoutPanelVisibility | null | undefined;
	onBehaviorChange?: (state: LayoutPanelState) => Partial<LayoutPanelState> | null | undefined | void;
	onKeyPress?: (event: KeyboardEvent, state: LayoutPanelState) => Partial<LayoutPanelState> | null | undefined | void;
	onVisibilityChange?: (state: LayoutPanelState) => Partial<LayoutPanelState> | null | undefined | void;
	visibility?: never;
}

export type LayoutPanelConfigProps =
	& CommonLayoutPanelConfigProps
	& (ControlledLayoutPanelProps | UncontrolledLayoutPanelProps)

export type OwnLayoutPanelProps =
	& BasicLayoutPanelProps
	& LayoutPanelConfigProps

export type LayoutPanelProps<C extends ElementType> =
	PolymorphicComponentPropsWithRef<C, OwnLayoutPanelProps>

export type LayoutPanelConfig = {
	[P in keyof Omit<LayoutPanelConfigProps, `on${string}`>]-?: P extends 'basis' | 'minWidth'
	? Exclude<OwnLayoutPanelProps[P], null | undefined>
	: Exclude<OwnLayoutPanelProps[P], undefined>
} & {
	ref: RefObject<HTMLElement>;
}

export type LayoutPanelComponentType = <C extends ElementType = 'section'>(
	props: LayoutPanelProps<C>,
) => React.ReactElement | null

export type LayoutPanelOptionalComponentType = <C extends ElementType = 'section'>(
	props: Partial<LayoutPanelProps<C>>,
) => React.ReactElement | null
