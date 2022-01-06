import React from 'react'
import type { RadioGroupState } from 'react-stately'

export const RadioContext = React.createContext<RadioGroupState>({
	name: '',
	isDisabled: false,
	isReadOnly: false,
	selectedValue: '',
	lastFocusedValue: '',
	setSelectedValue: () => {},
	setLastFocusedValue: () => {},
})
