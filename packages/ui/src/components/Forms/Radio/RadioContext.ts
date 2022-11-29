import { createContext } from 'react'
import type { RadioGroupState } from 'react-stately'

export const RadioContext = createContext<RadioGroupState>({
	name: '',
	isDisabled: false,
	isReadOnly: false,
	selectedValue: '',
	lastFocusedValue: '',
	setSelectedValue: () => {},
	setLastFocusedValue: () => {},
	validationState: 'valid',
})
