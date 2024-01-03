import { createSlotComponents } from '@contember/react-slots'

export const [commonSlots, CommonSlotSources, CommonSlotTargets] = createSlotComponents([
	'Actions',
	'Back',
	'Logo',
	'Navigation',
	'Sidebar',
	'Title',
	'Profile',
	'Switchers',
])

export const [contentSlots, ContentSlotSources, ContentSlotTargets] = createSlotComponents([
	'ContentFooter',
	'ContentHeader',
])

export const [headerSlots, HeaderSlotSources, HeaderSlotTargets] = createSlotComponents([
	'HeaderCenter',
	'HeaderEnd',
	'HeaderStart',
])

export const [footerSlots, FooterSlotSources, FooterSlotTargets] = createSlotComponents([
	'FooterCenter',
	'FooterEnd',
	'FooterStart',
])

export const [sidebarLeftSlots, SidebarLeftSlotSources, SidebarLeftSlotTargets] = createSlotComponents([
	'SidebarLeftBody',
	'SidebarLeftFooter',
	'SidebarLeftHeader',
])

export const [sidebarRightSlots, SidebarRightSlotSources, SidebarRightSlotTargets] = createSlotComponents([
	'SidebarRightBody',
	'SidebarRightFooter',
	'SidebarRightHeader',
])
