import { ComponentClassNameProps, NestedClassName, PolymorphicComponentPropsWithRef, isArrayOfMembersSatisfyingFactory, isNonEmptyString, isOneOfFactory, satisfiesOneOfFactory } from '@contember/utilities'
import { ElementType, PropsWithChildren, ReactElement, ReactNode, RefObject } from 'react'

export const panelBehaviorsList = ['static', 'collapsible', 'overlay', 'modal'] as const
export type PanelBehavior = typeof panelBehaviorsList[number]
export const isOneOfPanelBehaviors = isOneOfFactory<PanelBehavior>(panelBehaviorsList)
export type MaybePanelBehavior = PanelBehavior | null

export const panelVisibilityList = ['visible', 'hidden'] as const
export type PanelVisibility = typeof panelVisibilityList[number]
export const isOneOfPanelVisibilities = isOneOfFactory<PanelVisibility>(panelVisibilityList)
export type MaybePanelVisibility = PanelVisibility | null

export const isComponentClassName = satisfiesOneOfFactory(
	isArrayOfMembersSatisfyingFactory(isNonEmptyString),
	isNonEmptyString,
)

export interface OwnContainerProps extends ComponentClassNameProps, PropsWithChildren<{
	showDataState?: boolean;
}> { }

export type ContainerProps<C extends ElementType> = PolymorphicComponentPropsWithRef<C, OwnContainerProps>

export type ContainerComponentType =
	& (<C extends ElementType = 'div'>(props: ContainerProps<C>,) => React.ReactElement | null)
	& {
		displayName?: string | undefined;
	}

export type PanelState = {
	behavior: PanelBehavior;
	panel: string;
	visibility: PanelVisibility;
}

export interface PanelBasicProps extends ComponentClassNameProps, PropsWithChildren<{
	trapFocusInModal?: boolean;
	tabIndex?: never;
}> { }

export type CommonPanelConfigProps = {
	basis: number | null | undefined;
	maxWidth?: number | null | undefined;
	minWidth?: number | null | undefined;
	name: string;
	priority?: number | null | undefined;
}

export interface ControlledBehaviorPanelProps {
	behavior: PanelBehavior;
	defaultBehavior?: null | undefined;
	onBehaviorChange: (state: PanelState) => void;
}

export interface UncontrolledBehaviorPanelProps {
	behavior?: null | undefined;
	defaultBehavior: PanelBehavior;
	onBehaviorChange?: (state: PanelState) => Partial<Omit<PanelState, 'behavior'>> & { passive?: boolean } | null | undefined | void;
}

export interface ControlledVisibilityPanelProps {
	defaultVisibility?: null | undefined;
	onVisibilityChange: (state: PanelState) => void;
	visibility: PanelVisibility;
}

export interface UncontrolledVisibilityPanelProps {
	defaultVisibility: PanelVisibility;
	onVisibilityChange?: (state: PanelState) => Partial<Omit<PanelState, 'visibility'>> & { passive?: boolean } | null | undefined | void;
	visibility?: null | undefined;
}

export type ControlPanelProps =
	& (ControlledBehaviorPanelProps | UncontrolledBehaviorPanelProps)
	& (ControlledVisibilityPanelProps | UncontrolledVisibilityPanelProps)
	& {
		onKeyPress?: (event: KeyboardEvent, state: PanelState) => Partial<PanelState> & { passive?: boolean } | null | undefined | void;
	}

export type PanelConfigProps =
	& CommonPanelConfigProps
	& ControlPanelProps

export type OwnPanelProps =
	& PanelBasicProps
	& PanelConfigProps

export type PanelProps<C extends ElementType> = PolymorphicComponentPropsWithRef<C, OwnPanelProps>

export type PanelConfig =
	& {
		[P in keyof Omit<PanelConfigProps, `on${string}`>]-?: P extends 'basis' | 'minWidth'
		? Exclude<OwnPanelProps[P], null | undefined>
		: Exclude<OwnPanelProps[P], undefined>
	}
	& {
		ref: RefObject<HTMLElement>;
	}

export type PanelComponentType =
	& (<C extends ElementType = 'section'>(props: PanelProps<C>,) => ReactElement | null)
	& {
		displayName?: string | undefined;
	}

export type OwnPanelBodyProps = {
	children?: ReactNode;
	className?: NestedClassName;
	componentClassName?: string;
}

export type PanelBodyProps<C extends ElementType> = PolymorphicComponentPropsWithRef<C, OwnPanelBodyProps>

export type PanelBodyComponentType = (<C extends ElementType = 'div'>(
	props: PanelBodyProps<C>,
) => React.ReactElement | null) & {
	displayName?: string | undefined;
}

export type OwnPanelFooterProps = {
	children?: ReactNode;
	className?: NestedClassName;
	componentClassName?: string;
}

export type PanelFooterProps<C extends ElementType> = PolymorphicComponentPropsWithRef<C, OwnPanelFooterProps>

export type PanelFooterComponentType =
	& (<C extends ElementType = 'footer'>(props: PanelFooterProps<C>,) => React.ReactElement | null)
	& {
		displayName?: string | undefined;
	}

export type OwnPanelHeaderProps = {
	children?: ReactNode;
	className?: NestedClassName;
	componentClassName?: string;
}

export type PanelHeaderProps<C extends ElementType> = PolymorphicComponentPropsWithRef<C, OwnPanelHeaderProps>

export type PanelHeaderComponentType =
	& (<C extends ElementType = 'header'>(props: PanelHeaderProps<C>) => React.ReactElement | null)
	& {
		displayName?: string | undefined;
	}
