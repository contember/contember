import {
	CommonSlotSources,
	CommonSlotTargets,
	ContentSlotSources,
	ContentSlotTargets,
	FooterSlotSources,
	FooterSlotTargets,
	HeaderSlotSources,
	HeaderSlotTargets,
	SidebarLeftSlotSources,
	SidebarLeftSlotTargets,
	SidebarRightSlotSources,
	SidebarRightSlotTargets,
	commonSlots,
	contentSlots,
	footerSlots,
	headerSlots,
	sidebarLeftSlots,
	sidebarRightSlots,
} from '@contember/layout'

export const slots = [
	...commonSlots,
	...contentSlots,
	...sidebarLeftSlots,
	...sidebarRightSlots,
	...headerSlots,
	...footerSlots,
	// Your custom slot names will come here, e.g:
	// MySLot: 'my-slot',
]

export const SlotSources = {
	...CommonSlotSources,
	...ContentSlotSources,
	...HeaderSlotSources,
	...FooterSlotSources,
	...SidebarLeftSlotSources,
	...SidebarRightSlotSources,
	// Your custom slots will come here, e.g:
	// MySLot: Slots.createPortalComponent(slotTargets.MySLot),
}

export const SlotTargets = {
	...CommonSlotTargets,
	...ContentSlotTargets,
	...HeaderSlotTargets,
	...FooterSlotTargets,
	...SidebarLeftSlotTargets,
	...SidebarRightSlotTargets,
	// Your custom slot targets will come here, e.g:
	// MySLot: Slots.createTargetComponent(slotTargets.MySLot),
}
