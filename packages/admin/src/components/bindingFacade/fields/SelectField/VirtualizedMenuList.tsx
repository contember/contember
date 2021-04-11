import { FieldValue } from '@contember/binding'
import { ReactElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { MenuListComponentProps } from 'react-select'
import { ListChildComponentProps, VariableSizeList } from 'react-window'
import { ChoiceFieldData } from '../ChoiceField'

export function VirtualizedMenuList(
	props: MenuListComponentProps<ChoiceFieldData.SingleDatum<FieldValue | undefined>, boolean>,
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

	useEffect(() => {
		if (currentIndex >= 0 && list.current !== null) {
			list.current.scrollToItem(currentIndex)
		}
	}, [currentIndex, children, list])

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
		if (itemCountRef.current !== itemCount && list.current) {
			list.current.resetAfterIndex(0)
		}
		itemCountRef.current = itemCount
	}, [itemCount])

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
				const x = measuredHeightsRef.current.get(index)
				if (x !== undefined) {
					return x
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
