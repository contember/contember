import {
	CommonSlotSources,
	CommonSlotTargets,
	ContentSlotSources,
	ContentSlotTargets,
	FooterSlotSources,
	FooterSlotTargets,
	HeaderSlotSources,
	HeaderSlotTargets,
	commonSlots,
	contentSlots,
	footerSlots,
	headerSlots,
} from '@contember/layout'
import { useDocumentTitle } from '@contember/react-utils'
import { memo } from 'react'

export const slots = [
	...commonSlots,
	...contentSlots,
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
	// Your custom slots will come here, e.g:
	// MySLot: Slots.createPortalComponent(slotTargets.MySLot),
}

export const SlotTargets = {
	...CommonSlotTargets,
	...ContentSlotTargets,
	...HeaderSlotTargets,
	...FooterSlotTargets,
	// Your custom slot targets will come here, e.g:
	// MySLot: Slots.createTargetComponent(slotTargets.MySLot),
}

export const Title = memo<{ children: string | null | undefined }>(({ children }) => {
	useDocumentTitle(children)

	return (
		<CommonSlotSources.Title>{children}</CommonSlotSources.Title>
	)
})
