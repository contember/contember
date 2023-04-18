import { NonNullableRequired } from '../packages/typescript-utilities'
import { slotTargets } from './Slots'
import { PublicContentProps, PublicSidebarProps } from './Types'

export const PANEL_LEFT_NAME = 'cms-sidebar-left'
export const PANEL_LEFT_WIDTH = 256

export const PANEL_RIGHT_NAME = 'cms-sidebar-right'
export const PANEL_RIGHT_WIDTH = 256

export const PANEL_CONTENT_NAME = 'cms-content'
export const PANEL_CONTENT_BASIS = 640
export const PANEL_CONTENT_MIN_WIDTH = 480
export const PANEL_CONTENT_MAX_WIDTH = 720

export const defaultPublicSidebarLeftProps: NonNullableRequired<PublicSidebarProps> = {
	keepVisible: false,
	width: PANEL_LEFT_WIDTH,
}

export const defaultPublicSidebarRightProps: NonNullableRequired<PublicSidebarProps> = {
	keepVisible: false,
	width: PANEL_RIGHT_WIDTH,
}

export const defaultContentProps: NonNullableRequired<PublicContentProps> = {
	basis: PANEL_CONTENT_BASIS,
	maxWidth: false,
	minWidth: PANEL_CONTENT_MIN_WIDTH,
}

export const sidebarLeftSlots = [
	slotTargets.SidebarLeftHeader,
	slotTargets.SidebarLeftBody,
	slotTargets.SidebarLeftFooter,
	slotTargets.Navigation,
]

export const sidebarRightSlots = [
	slotTargets.SidebarRightHeader,
	slotTargets.Sidebar,
	slotTargets.SidebarRightBody,
	slotTargets.SidebarRightFooter,
]
