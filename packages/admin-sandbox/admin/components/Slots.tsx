import { CMSLayout } from '@contember/cms-layout'
import { CommonSlots, createLayoutSlotComponent, createLayoutSlotTargetComponent, wrapSlotWithStack } from '@contember/layout'

export const { Actions, Back, Title: TitleSlot, Content, Logo: LogoSlot, Navigation, Sidebar, ...restOfCommonSlots } = CommonSlots

if (import.meta.env.DEV) {
	const exhaustiveCheck: Record<string, never> = restOfCommonSlots
}

type SlotsMapType = Record<keyof typeof slotTargets, ReturnType<typeof createLayoutSlotComponent>>
type SlotTargetsMapType = Record<keyof typeof slotTargets, ReturnType<typeof createLayoutSlotTargetComponent>>

export const slotTargets = Object.freeze({
	...CMSLayout.slotTargets,
	// Your custom slot names will come here, e.g:
	// MySlot: 'my-slot',
})

export const Slots: SlotsMapType = {
	...CMSLayout.Slots,
	// Your custom slots will come here, e.g:
	// MySlot: createLayoutSlotComponent(slotTargets.MySlot, 'MySlot'),
}

export const SlotTargets: SlotTargetsMapType = {
	...CMSLayout.SlotTargets,
	// Your custom slot targets will come here, e.g:
	// MySlot: createLayoutSlotTargetComponent(slotTargets.MySlot, 'MySlot'),
}

export const SidebarStack = wrapSlotWithStack(Sidebar)
export const ContentStack = wrapSlotWithStack(Content)
