import type { CommonProps, GroupBase, InputProps } from 'react-select'
import cn from 'classnames'

// This function is copied from react-select.
export const cleanCommonProps = (props: CommonProps<any, boolean, never> & { className?: any }): any => {
	//className
	const {
		className, // not listed in commonProps documentation, needs to be removed to allow Emotion to generate classNames
		clearValue,
		cx,
		getStyles,
		getValue,
		hasValue,
		isMulti,
		isRtl,
		options, // not listed in commonProps documentation
		selectOption,
		selectProps,
		setValue,
		theme, // not listed in commonProps documentation
		...innerProps
	} = props
	return { ...innerProps }
}

export const SearchInput = (props: InputProps<any, boolean, never>) => {
	const { innerRef, isDisabled, isHidden, ...innerProps } = cleanCommonProps(props as any)

	return (
		<div className={cn('selectField-search', isHidden && 'is-hidden')} data-value={innerProps.value}>
			<input
				type="text"
				className="selectField-search-input"
				ref={innerRef as any}
				disabled={isDisabled}
				{...innerProps}
			/>
		</div>
	)
}
