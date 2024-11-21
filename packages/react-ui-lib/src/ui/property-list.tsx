import { ReactNode } from 'react'
import { uic } from '../utils'

export const PropertyList = uic('div', {
	baseClass: 'relative overflow-auto bg-gray-50/50 max-w-lg border rounded-md grid grid-cols-[max-content,1fr]',
	displayName: 'PropertyList',
})

export const PropertyRow = uic('div', {
	baseClass: 'contents group',
})

export const PropertyLabel = uic('div', {
	baseClass: 'text-sm min-w-32 border-b group-last:border-b-none px-4 py-3',
	displayName: 'PropertyLabel',
})

export const PropertyValue = uic('div', {
	baseClass: 'text-sm font-semibold border-b group-last:border-b-none px-4 py-3',
	displayName: 'PropertyValue',
})

/**
 * Shortcut for creating a property list item with a label and a value.
 */
export const PropertyItem = (({ label, children }: { label: string; children: ReactNode }) => {
	return (
		<PropertyRow>
			<PropertyLabel>{label}</PropertyLabel>
			<PropertyValue>{children}</PropertyValue>
		</PropertyRow>
	)
})
