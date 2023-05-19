import { CMSLayout } from '@contember/cms-layout'
import {
	CommonSlots,
	createLayoutSlotComponent,
	createLayoutSlotTargetComponent,
	wrapSlotWithStack,
} from '@contember/layout'

type SlotsMapType = Record<keyof typeof slotTargets, ReturnType<typeof createLayoutSlotComponent>>
type SlotTargetsMapType = Record<keyof typeof slotTargets, ReturnType<typeof createLayoutSlotTargetComponent>>

export const slotTargets = Object.freeze({
	...CMSLayout.slotTargets,
	// Your custom slot names will come here, e.g:
	// MySlot: 'my-slot',
})

const SidebarStack = wrapSlotWithStack(CommonSlots.Sidebar)
const ContentStack = wrapSlotWithStack(CommonSlots.Content)

export const Slots: SlotsMapType & {
	SidebarStack: typeof SidebarStack;
	ContentStack: typeof ContentStack;
} = {
	SidebarStack,
	ContentStack,
	...CMSLayout.Slots,
	// Your custom slots will come here, e.g:
	// MySlot: createLayoutSlotComponent(slotTargets.MySlot, 'MySlot'),
}

export const SlotTargets: SlotTargetsMapType = {
	...CMSLayout.SlotTargets,
	// Your custom slot targets will come here, e.g:
	// MySlot: createLayoutSlotTargetComponent(slotTargets.MySlot, 'MySlot'),
}
