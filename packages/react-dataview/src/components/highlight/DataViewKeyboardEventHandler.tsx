import * as React from 'react'
import { forwardRef, ReactNode } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewKeyboardEventHandler } from '../../contexts'

export const DataViewKeyboardEventHandler = forwardRef<HTMLElement, { children: ReactNode }>((props, ref) => {
	const keyboardEventHandler = useDataViewKeyboardEventHandler()
	return (
		<Slot
			onKeyDown={keyboardEventHandler}
			ref={ref}
			{...props}
		/>
	)
})
