import { useMemo } from 'react'
import type { CSSObjectWithLabel, GroupBase, StylesConfig } from 'react-select'

export type PublicCommonReactSelectStylesProps = {
	/**
	 * Use to set z-index of the drop-down menu in portal
	 */
	menuZIndex?: number
}

export type CommonReactSelectStylesProps =
	& PublicCommonReactSelectStylesProps
	& { isInvalid?: boolean }

export const useCommonReactSelectStyles = <Option = unknown, IsMulti extends boolean = boolean, Group extends GroupBase<Option> = GroupBase<Option>>({ isInvalid = false, menuZIndex }: CommonReactSelectStylesProps): StylesConfig<Option, IsMulti, Group> => useMemo(() => ({
	indicatorSeparator: (provided, { isFocused, isDisabled }): CSSObjectWithLabel => {
		const backgroundColor = isDisabled
			? 'rgba(var(--cui-color--rgb-50), var(--cui-opacity--lower))'
			: isFocused
				? 'rgba(var(--cui-color--rgb-50), var(--cui-opacity--low))'
				: 'rgba(var(--cui-color--rgb-50), var(--cui-opacity--lower))'
		const custom: CSSObjectWithLabel = {
			backgroundColor,
		}
		return {
			...provided,
			...custom,
		}
	},
	indicatorsContainer: (provided, { isDisabled }) => {
		const color = isDisabled
			? 'rgba(var(--cui-color--rgb-50), var(--cui-opacity--low))'
			: 'rgb(var(--cui-color--rgb-50))'

		const custom: CSSObjectWithLabel = {
			color,
			margin: 'calc(-1 * var(--cui-border-width, 1px)) 0',
			padding: '0 var(--cui-gap)',

		}

		return {
			...provided,
			...custom,
		}
	},
	valueContainer: provided => {
		const custom: CSSObjectWithLabel = {
			display: 'flex',
			gap: 'var(--cui-gap)',
			padding: 'var(--cui-gap) calc(var(--cui-gutter) - var(--cui-border-width))',
		}
		return {
			...provided,
			...custom,
		}
	},
	placeholder: provided => {
		const custom: CSSObjectWithLabel = {
			color: 'rgba(var(--cui-color--rgb-25), var(--cui-opacity--high))',
			margin: 0,
			position: 'absolute',
		}
		return {
			...provided,
			...custom,
		}
	},
	singleValue: (provided, { isDisabled }) => {
		const color = isDisabled
			? 'rgba(var(--cui-color--rgb-50), var(--cui-opacity--low))'
			: 'rgb(var(--cui-color--strong-rgb-50))'

		const custom: CSSObjectWithLabel = {
			color,
		}

		return {
			...provided,
			...custom,
		}
	},
	multiValue: (provided, { isDisabled }) => {
		const borderColor = isDisabled ? 'rgba(var(--cui-color--rgb-50), var(--cui-opacity--low))' : 'rgb(var(--cui-background-color--toned-rgb-75))'
		const backgroundColor = isDisabled ? 'rgba(var(--cui-color--rgb-50), var(--cui-opacity--lower))' : 'rgba(var(--cui-background-color--toned-rgb-50), var(--cui-opacity--lower))'
		const borderWidth = 'var(--cui-border-width, 1px)'
		const lineHeight = 'var(--cui-line-height--controls)'
		const margin = 0
		const padding = '0 0 0 calc(var(--cui-gap) - var(--cui-border-width, 1px))'
		const custom: CSSObjectWithLabel = {
			backgroundColor,
			borderColor,
			borderWidth,
			margin,
			padding,
			lineHeight,
			'&:hover': {
				borderColor: isDisabled ? borderColor : 'rgba(var(--cui-color--rgb-50), var(--cui-opacity--high))',
			},
		}

		return {
			...provided,
			...custom,
		}
	},
	multiValueLabel: (provided, { isDisabled }) => {
		const color = isDisabled ? 'rgba(var(--cui-color--rgb-50), var(--cui-opacity--low))' : 'rgb(var(--cui-color--strong-rgb-50))'
		const custom: CSSObjectWithLabel = {
			color,
		}
		return {
			...provided,
			...custom,
		}
	},
	multiValueRemove: provided => {
		const color = 'rgb(var(--cui-color--strong-rgb-50))'
		const colorHover = 'rgb(var(--cui-color--accent-rgb-75))'
		const backgroundColor = 'rgba(var(--cui-background-color--toned-controls-rgb-75), var(--cui-opacity--low))'

		// TODO: Indirect, but there seems to be no better way for now
		const isFocusing = provided.backgroundColor

		const custom: CSSObjectWithLabel = {
			color,
			'backgroundColor': isFocusing ? backgroundColor : undefined,
			'opacity': isFocusing ? 1 : 0.5,
			'&:hover': {
				color: colorHover,
				backgroundColor,
				opacity: 1,
			},
		}

		return {
			...provided,
			...custom,
		}
	},
	dropdownIndicator: (provided, { isFocused, isDisabled }) => {
		const custom: CSSObjectWithLabel = {
			'alignSelf': 'stretch',
			'alignItems': 'center',
			'color': isDisabled
				? 'rgba(var(--cui-color--rgb-50), var(--cui-opacity--low))'
				: isFocused
					? 'rgb(var(--cui-color--rgb-0))'
					: 'rgb(var(--cui-color--rgb-50))',
			'padding': '0 var(--cui-gap)',
			'&:hover': {
				color: 'rgb(var(--cui-color--rgb-0))',
			},
		}
		return {
			...provided,
			...custom,
		}
	},
	clearIndicator: (provided, { isFocused }) => {
		const custom: CSSObjectWithLabel = {
			'color': isFocused
				? 'rgb(var(--cui-color--rgb-0))'
				: 'rgb(var(--cui-color--rgb-50))',
			'&:hover': {
				color: 'rgb(var(--cui-color--rgb-0))',
			},
		}
		return {
			...provided,
			...custom,
		}
	},
	control: (provided, { isFocused, isDisabled }) => {
		const backgroundColor = 'rgba(var(--cui-background-color--rgb-25), var(--cui-opacity--medium))'
		const color = isDisabled
			? 'rgba(var(--cui-color--rgb-50), var(--cui-opacity--low))'
			: isFocused
				? 'rgb(var(--cui-color--rgb-0))'
				: 'rgb(var(--cui-color--rgb-50))'

		const borderColor = isInvalid
			? 'rgb(var(--cui-theme-danger--rgb-500))'
			: isDisabled
				? 'rgba(var(--cui-color--rgb-50), var(--cui-opacity--lower))'
				: 'rgb(var(--cui-background-color--toned-rgb-75))'

		const custom: CSSObjectWithLabel = {
			backgroundColor,
			borderColor,
			'borderWidth': 'var(--cui-border-width, 1px)',
			color,
			'borderRadius': 'var(--cui-border-radius--controls)',
			'boxShadow': isFocused ? 'var(--cui-box-shadow--controls-focus-ring)' : undefined,
			'minHeight': 'var(--cui-size--controls)',
			'&:hover': {
				color: 'rgb(var(--cui-color--rgb-0))',
				borderColor: isDisabled
					? 'rgba(var(--cui-color--rgb-50), var(--cui-opacity--low))'
					: 'rgba(var(--cui-color--rgb-50), var(--cui-opacity--high))',
			},
		}
		return {
			...provided,
			...custom,
		}
	},
	menu: provided => {
		const backgroundColor = 'rgb(var(--cui-background-color--rgb-50))'
		const border = 'var(--cui-border-width, 1px) solid rgb(var(--cui-background-color--toned-rgb-75))'

		const custom: CSSObjectWithLabel = {
			backgroundColor,
			border,
		}
		return {
			...provided,
			...custom,
		}
	},
	menuList: provided => {
		const custom: CSSObjectWithLabel = {
			display: 'flex',
			flexDirection: 'column',
			gap: 'var(--cui-gap)',
			padding: 'var(--cui-gap)',
			zIndex: menuZIndex ?? 'unset',
		}
		return {
			...provided,
			...custom,
		}
	},
	menuPortal: provided => {
		return {
			// ...provided,
			zIndex: 150,
		}
	},
	option: (provided, { isFocused, isSelected }) => {
		const custom: CSSObjectWithLabel = {
			'borderRadius': 'var(--cui-border-radius--controls)',
			'backgroundColor': isFocused
				? 'rgb(var(--cui-background-color--controls-rgb-75))'
				: isSelected
					? 'rgb(var(--cui-background-color--controls-rgb-100))'
					: 'transparent',
			'color': isFocused
				? 'rgb(var(--cui-color--controls-rgb-75))'
				: isSelected
					? 'rgb(var(--cui-color--controls-rgb-100))'
					: 'var(--cui-color--controls-rgb-50)',
			'lineHeight': 'var(--cui-line-height--controls)',
			'padding': 'var(--cui-double-gap)',
			'&:hover': {
				backgroundColor: isSelected
					? 'rgb(var(--cui-background-color--controls-rgb-100))'
					: 'rgb(var(--cui-background-color--controls-rgb-75))',
				color: isSelected
					? 'rgb(var(--cui-color--controls-rgb-100))'
					: 'rgb(var(--cui-color--controls-rgb-75))',
			},
		}
		return {
			...provided,
			...custom,
		}
	},
}), [isInvalid, menuZIndex])
