import { ComponentClassNameProps, PolymorphicComponent, isArrayOfMembersSatisfyingFactory, isNonEmptyString, isOneOfFactory, satisfiesOneOfFactory } from '@contember/utilities'
import { ComponentProps, PropsWithChildren, ReactNode, RefObject } from 'react'

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

export type OwnContainerProps = ComponentClassNameProps & PropsWithChildren<{
	showDataState?: boolean;
}>

export type ContainerProps = ComponentProps<ContainerComponentType>

export type ContainerComponentType = PolymorphicComponent<'div', OwnContainerProps>

export type PanelState = {
	behavior: PanelBehavior;
	panel: string;
	visibility: PanelVisibility;
}

export type PanelBasicProps = ComponentClassNameProps & PropsWithChildren<{
	/**
	 * If true, when the panel behavior is modal, the focus will be trapped inside the panel.
	 */
	trapFocusInModal?: boolean | null | undefined;
	tabIndex?: never;
}>

export type CommonPanelConfigProps = {
	/**
	 * Flex basis of the panel, default is 320 (pixels).
	 */
	basis?: number;
	/**
	 * Max width of the panel. If the value is false or null, the panel will have no max width.
	 */
	maxWidth?: number | false | null | undefined;
	/**
	 * Min width of the panel. If the value is false or null, the panel will have no min width.
	 */
	minWidth?: number | false | null | undefined;
	/**
	 * Name of the panel, only one panel with the same name can be registered at the same time.
	 */
	name: string;
	/**
	 * Priority of the panel, used for determining which panel will be hidden when there is not enough space for all panels.
	 */
	priority?: number | false | null | undefined;
}

export type ControlledBehaviorPanelProps = {
	behavior: PanelBehavior;
	defaultBehavior?: null | undefined;
	onBehaviorChange: (state: PanelState) => void;
}

export type UncontrolledBehaviorPanelProps = {
	behavior?: null | undefined;
	defaultBehavior: PanelBehavior;
	onBehaviorChange?: (state: PanelState) => Partial<Omit<PanelState, 'behavior'>> & { passive?: boolean } | null | undefined | void;
}

export type ControlledVisibilityPanelProps = {
	defaultVisibility?: null | undefined;
	onVisibilityChange: (state: PanelState) => void;
	visibility: PanelVisibility;
}

export type UncontrolledVisibilityPanelProps = {
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

export type PanelProps = ComponentProps<PanelComponentType>

export type PanelConfig =
	& {
		[P in keyof Omit<PanelConfigProps, `on${string}`>]-?: P extends 'basis' | 'minWidth'
		? Exclude<OwnPanelProps[P], null | undefined>
		: Exclude<OwnPanelProps[P], undefined>
	}
	& {
		ref: RefObject<HTMLElement>;
	}

export type PanelComponentType = PolymorphicComponent<'section', OwnPanelProps>

export type OwnPanelBodyProps = PropsWithChildren<ComponentClassNameProps>

export type PanelBodyProps = ComponentProps<PanelBodyComponentType>

export type PanelBodyComponentType = PolymorphicComponent<'div', OwnPanelBodyProps>

export type OwnPanelFooterProps = PropsWithChildren<ComponentClassNameProps>

export type PanelFooterProps = ComponentProps<PanelFooterComponentType>

export type PanelFooterComponentType = PolymorphicComponent<'footer', OwnPanelFooterProps>

export type OwnPanelHeaderProps = PropsWithChildren<ComponentClassNameProps>

export type PanelHeaderProps = ComponentProps<PanelHeaderComponentType>

export type PanelHeaderComponentType = PolymorphicComponent<'header', OwnPanelFooterProps>
