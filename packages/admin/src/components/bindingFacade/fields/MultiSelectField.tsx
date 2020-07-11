import { Component, ErrorAccessor, FieldValue } from '@contember/binding'
import { FormGroup, FormGroupProps } from '@contember/ui'
import Fuse from 'fuse.js'
import * as React from 'react'
import { MenuListComponentProps, Props as SelectProps } from 'react-select'
import AsyncSelect from 'react-select/async'
import { FixedSizeList } from 'react-window'

import { ChoiceField, ChoiceFieldData, DynamicMultipleChoiceFieldProps, StaticChoiceFieldProps } from './ChoiceField'

export type MultiSelectFieldProps = MultiSelectFieldInnerPublicProps &
	(Omit<StaticChoiceFieldProps<'multiple'>, 'arity'> | DynamicMultipleChoiceFieldProps)

export const MultiSelectField = Component<MultiSelectFieldProps>(
	props => (
		<ChoiceField {...props} arity="multiple">
			{({
				data,
				currentValues,
				onChange,
				errors,
				environment,
				isMutating,
				clear,
			}: ChoiceFieldData.MultipleChoiceFieldMetadata) => (
				<MultiSelectFieldInner
					label={props.label}
					data={data}
					currentValues={currentValues}
					onChange={onChange}
					environment={environment}
					errors={errors}
					isMutating={isMutating}
					clear={clear}
				/>
			)}
		</ChoiceField>
	),
	'MultiSelectField',
)

export interface MultiSelectFieldInnerPublicProps extends Omit<FormGroupProps, 'children'> {
	//firstOptionCaption?: string
	placeholder?: string
	reactSelectProps?: Partial<SelectProps<any>>
}

export interface MultiSelectFieldInnerProps
	extends ChoiceFieldData.MultipleChoiceFieldMetadata,
		MultiSelectFieldInnerPublicProps {
	errors: ErrorAccessor[]
}

const MultiSelectFieldInner = React.memo(
	({
		currentValues,
		data,
		environment,
		errors,
		isMutating,
		onChange,
		clear,
		reactSelectProps,
		...formGroupProps
	}: MultiSelectFieldInnerProps) => {
		const fuse = React.useMemo(
			() =>
				new Fuse(data, {
					keys: ['label'],
				}),
			[data],
		)
		return (
			<FormGroup {...formGroupProps} label={environment.applySystemMiddleware('labelMiddleware', formGroupProps.label)}>
				<AsyncSelect
					isMulti
					isClearable
					closeMenuOnSelect={false}
					styles={{
						menu: base => ({
							...base,
							zIndex: 99,
						}),
					}}
					{...reactSelectProps}
					loadOptions={(inputValue, callback) => {
						const result = fuse.search(inputValue)
						callback(result.map(item => item.item))
					}}
					defaultOptions={data}
					components={
						data.length > 100
							? {
									MenuList: VirtualizedMenuList,
							  }
							: {}
					}
					getOptionValue={datum => datum.key.toFixed()}
					value={Array.from(currentValues, key => data[key])}
					onChange={(newValues, actionMeta) => {
						switch (actionMeta.action) {
							case 'select-option': {
								onChange(actionMeta.option!.key, true)
								break
							}
							case 'remove-value': {
								onChange(actionMeta.removedValue!.key, false)
								break
							}
							case 'pop-value': {
								if (currentValues.length > 0) {
									onChange(currentValues[currentValues.length - 1], false)
								}
								break
							}
							case 'clear': {
								clear()
								break
							}
							case 'create-option': {
								// TODO not yet supported
								break
							}
							case 'deselect-option':
							case 'set-value': {
								// When is this even called? 🤔
								break
							}
						}
					}}
				/>
			</FormGroup>
		)
	},
)

const VirtualizedMenuList = React.memo(function VirtualizedMenuList(
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
		>
			{({ index, style }) => (
				<div
					className="option-wrapper"
					style={{ ...style, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
				>
					{children[index]}
				</div>
			)}
		</FixedSizeList>
	)
})
