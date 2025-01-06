import * as React from 'react'
import { forwardRef, ReactNode } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewKeyboardEventHandler } from '../../contexts'

/**
 * A component that listens for keyboard events and dispatches them to the data view.
 */
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
