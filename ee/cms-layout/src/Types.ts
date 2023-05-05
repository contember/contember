import { OwnContainerProps } from '@contember/layout'
import { PolymorphicComponentPropsWithRef } from '@contember/utilities'
import { ElementType, ReactElement } from 'react'

export interface PublicSidebarProps {
	keepVisible?: boolean | null | undefined;
	width?: number | null | undefined;
}

export interface PublicContentProps {
	basis?: number | null | undefined;
	minWidth?: number | null | undefined;
	maxWidth?: number | false | null | undefined;
}

export interface CMSLayoutContentProps extends OwnContainerProps {
	panelName: string;
	basis: number;
	minWidth: number;
	maxWidth: number | false;
}

export interface CMSLayoutRootProps extends OwnContainerProps {
	breakpoint: number;
	sidebarLeftProps?: false | PublicSidebarProps;
	sidebarRightProps?: false | PublicSidebarProps;
	contentProps?: PublicContentProps;
}

export type OwnCMSLayoutSidebarProps =
	& OwnContainerProps
	& {
		keepVisible?: boolean | null | undefined;
		panelName: string;
		priority?: number | null | undefined;
		trapFocusInModal?: boolean | null | undefined;
		width: number;
	}

export type CMSLayoutSidebarProps<C extends ElementType> =
	PolymorphicComponentPropsWithRef<C, OwnCMSLayoutSidebarProps>

export type CMSLayoutSidebarComponentType = (<C extends ElementType = 'section'>(
	props: CMSLayoutSidebarProps<C>,
) => ReactElement | null) & {
	displayName?: string | undefined;
}
