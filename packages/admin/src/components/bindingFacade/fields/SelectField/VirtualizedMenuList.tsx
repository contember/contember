import { FieldValue } from '@contember/binding'
import * as React from 'react'
import { MenuListComponentProps } from 'react-select'
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import { ChoiceFieldData } from '../ChoiceField'

export const VirtualizedMenuList: React.ComponentType<
	MenuListComponentProps<ChoiceFieldData.SingleDatum<FieldValue | undefined>>
> = React.memo(function VirtualizedMenuList(
	props: MenuListComponentProps<ChoiceFieldData.SingleDatum<FieldValue | undefined>>,
) {
	const { children, maxHeight, innerRef } = props
	const height = 40
	const list = React.useRef<FixedSizeList>(null)

	// This is taken from react-windowed-select
	const currentIndex = React.useMemo(() => {
		if (!Array.isArray(children)) {
			return 0
		}
		return Math.max(
			children.findIndex(child => (child as React.ReactElement).props.isFocused === true),
			0,
		)
	}, [children])

	React.useEffect(() => {
		if (currentIndex >= 0 && list.current !== null) {
			list.current.scrollToItem(currentIndex)
		}
	}, [currentIndex, children, list])

	if (!Array.isArray(children)) {
		return <>{children}</>
	}

	return (
		<FixedSizeList
			height={Math.min(maxHeight, children.length * height)}
			itemCount={children.length}
			initialScrollOffset={currentIndex * height}
			itemSize={height}
			ref={list}
			width={''} // 100% width
			outerRef={innerRef}
			itemKey={dataKey => props.options[dataKey].key}
			itemData={props}
		>
			{Item}
		</FixedSizeList>
	)
})

function Item({ index, style, data }: ListChildComponentProps) {
	return (
		<div style={{ ...style }} key={data.options[index].key} className="selectField-optionWrapper">
			{data.children[index]}
		</div>
	)
}
