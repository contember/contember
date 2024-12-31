import * as React from 'react'
import { forwardRef, ReactElement, useCallback } from 'react'
import { useDataViewInfiniteLoadTrigger } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'
import { composeEventHandlers } from '@radix-ui/primitive'

const SlotType = Slot as React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>

/**
 * A trigger component for infinite loading in a data view.
 * Automatically disables the trigger when no more data is available.
 * Note: Infinite load is not enabled by default. Use `DataViewInfiniteLoadProvider` to enable it.
 *
 * ## Props
 * - **`children`**: The button or element used as the trigger.
 *
 * ## Example
 * ```tsx
 * <DataViewInfiniteLoadTrigger>
 *     <button>Load More</button>
 * </DataViewInfiniteLoadTrigger>
 * ```
 */
export const DataViewInfiniteLoadTrigger = forwardRef<HTMLButtonElement, { children: ReactElement }>(
	({ children, ...props }, ref) => {
		const triggerLoadMore = useDataViewInfiniteLoadTrigger()

		const handleClick = useCallback(() => {
			if (triggerLoadMore) {
				triggerLoadMore()
			}
		}, [triggerLoadMore])

		const { onClick, ...otherProps } = props as React.HTMLAttributes<HTMLButtonElement>

		return (
			<SlotType
				ref={ref}
				onClick={composeEventHandlers(onClick, handleClick)}
				disabled={triggerLoadMore === undefined}
				{...otherProps}
			>
				{children}
			</SlotType>
		)
	},
)

DataViewInfiniteLoadTrigger.displayName = 'DataViewInfiniteLoadTrigger'
