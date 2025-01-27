import { createSlotComponents } from '@contember/react-slots'
import { useChildrenAsLabel, useDocumentTitle } from '@contember/react-utils'
import { memo, ReactNode } from 'react'

export const [, Slots, SlotTargets] = createSlotComponents([
	'Title',
	'Logo',
	'Navigation',
	'Footer',
	'Back',
	'Content',
	'ContentHeader',
	'Sidebar',
	'Actions',
	'UserNavigation',
])
export const Title = memo<{ children: ReactNode }>(({ children }) => {
	const titleText = useChildrenAsLabel(children)
	useDocumentTitle(titleText)

	return (
		<Slots.Title>{children}</Slots.Title>
	)
})

