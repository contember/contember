import { ReactElement, useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import type { MenuListProps } from 'react-select'
import { ListChildComponentProps, VariableSizeList } from 'react-window'
import type { ChoiceFieldData } from '../ChoiceField'

export function VirtualizedMenuList(
	props: MenuListProps<ChoiceFieldData.SingleDatum, boolean, never>,
) {
	const { children, maxHeight, innerRef } = props
	const height = 40
	const list = useRef<VariableSizeList>(null)
	const itemCount = Array.isArray(children) ? children.length : 0

	// A lot of the following was originally adapted from react-windowed-select.
	const currentIndex = useMemo(() => {
		if (!Array.isArray(children)) {
			return 0
		}
		return Math.max(
			children.findIndex(child => (child as ReactElement).props.isFocused === true),
			0,
		)
	}, [children])

	const measuredHeightsRef = useRef<Map<number, number>>(new Map())
	const leastPendingIndexRef = useRef<number | null>(null)

	const setMeasuredHeight = useCallback(
		(index: number, height: number) => {
			const key = props.options[index].key
			const existingHeight = measuredHeightsRef.current.get(key)

			if (existingHeight !== undefined) {
				return
			}
			measuredHeightsRef.current.set(index, height)

			if (list.current) {
				list.current.resetAfterIndex(index)
				leastPendingIndexRef.current = null
			} else if (leastPendingIndexRef.current === null || index < leastPendingIndexRef.current) {
				leastPendingIndexRef.current = index
			}
		},
		[measuredHeightsRef, props.options],
	)
	useLayoutEffect(() => {
		if (leastPendingIndexRef.current !== null && list.current) {
			list.current.resetAfterIndex(leastPendingIndexRef.current)
			leastPendingIndexRef.current = null
		}
	}, [])

	const itemCountRef = useRef(itemCount)
	useLayoutEffect(() => {
		if (list.current) {
			if (itemCountRef.current !== itemCount) {
				list.current.resetAfterIndex(0)
				list.current.scrollToItem(0)
			} else if (currentIndex >= 0) {
				list.current.scrollToItem(currentIndex)
			}
		}
		itemCountRef.current = itemCount
	}, [currentIndex, itemCount])

	if (!Array.isArray(children)) {
		return <>{children}</>
	}

	return (
		<VariableSizeList
			height={Math.min(maxHeight, itemCount * height)}
			itemCount={itemCount}
			initialScrollOffset={currentIndex * height}
			estimatedItemSize={height}
			itemSize={index => {
				const measuredHeight = measuredHeightsRef.current.get(index)
				if (measuredHeight !== undefined) {
					return measuredHeight
				}
				return height
			}}
			ref={list}
			width="" // 100% width
			outerRef={innerRef}
			itemKey={dataKey => props.options[dataKey].key}
			itemData={{
				...props,
				setMeasuredHeight,
			}}
		>
			{Item}
		</VariableSizeList>
	)
}

function Item({ index, style, data }: ListChildComponentProps) {
	const ref = useRef<HTMLDivElement>(null)
	const setMeasuredHeight = data.setMeasuredHeight as (index: number, height: number) => void

	useLayoutEffect(() => {
		if (!ref.current) {
			return
		}
		const measuredHeight = ref.current.getBoundingClientRect().height
		setMeasuredHeight(index, measuredHeight)
	}, [index, setMeasuredHeight])

	// These need to be separate divs in order for the height measurements to work as the style object contains
	// a height override and we'd be essentially just "measuring" that.
	return (
		<div style={{ ...style }} key={data.options[index].key} className="selectField-optionWrapper">
			<div ref={ref}>{data.children[index]}</div>
		</div>
	)
}
