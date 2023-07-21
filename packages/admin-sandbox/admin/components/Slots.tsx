import {
	CommonSlotSources,
	CommonSlotTargets,
	ContentSlotSources,
	ContentSlotTargets,
	FooterSlotSources,
	FooterSlotTargets,
	HeaderSlotSources,
	HeaderSlotTargets,
	// When you define new slots, you need import:
	// Slots,
	commonSlots,
	contentSlots,
	footerSlots,
	headerSlots,
} from '@contember/layout'
import { useDocumentTitle } from '@contember/react-utils'
import { memo } from 'react'

const Title = memo<{ children: string | null | undefined }>(({ children }) => {
	useDocumentTitle(children)

	return (
		<CommonSlotSources.Title>{children}</CommonSlotSources.Title>
	)
})

export const slots = [
	...commonSlots,
	...contentSlots,
	...headerSlots,
	...footerSlots,
	// Your custom slot names will come here, e.g:
	// 'MySlot',
]

export const SlotSources = {
	...CommonSlotSources,
	...ContentSlotSources,
	...HeaderSlotSources,
	...FooterSlotSources,
	Title,
	// Your custom slots will come here, e.g:
	// MySLot: Slots.createSlotSourceComponent('MySlot'),
}

export const SlotTargets = {
	...CommonSlotTargets,
	...ContentSlotTargets,
	...HeaderSlotTargets,
	...FooterSlotTargets,
	// Your custom slot targets will come here, e.g:
	// MySLot: Slots.createSlotTargetComponent('MySlot'),
}
