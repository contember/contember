import { createSlotComponents } from '@contember/react-slots'
import { useChildrenAsLabel, useDocumentTitle } from '@contember/react-utils'
import { memo, ReactNode } from 'react'

export const [, Slot, SlotTargets] = createSlotComponents([
	'Title',
	'Logo',
	'Navigation',
	'Profile',
	'Footer',
	'Back',
	'Content',
	'ContentHeader',
	'Sidebar',
	'Actions',
])
export const Title = memo<{ children: ReactNode }>(({ children }) => {
	const titleText = useChildrenAsLabel(children)
	useDocumentTitle(titleText)

	return (
		<Slot.Title>{children}</Slot.Title>
	)
})

