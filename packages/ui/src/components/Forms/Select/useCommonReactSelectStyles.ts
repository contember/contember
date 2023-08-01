import { useMemo } from 'react'
import type { GroupBase, StylesConfig } from 'react-select'

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
	indicatorSeparator: (provided, { isFocused, isDisabled }) => {
		const backgroundColor = isDisabled
			? 'rgba(var(--cui-color-rgb-50), var(--cui-opacity--lower))'
			: isFocused
				? 'rgba(var(--cui-color-rgb-50), var(--cui-opacity--low))'
				: 'rgba(var(--cui-color-rgb-50), var(--cui-opacity--lower))'

		return {
			...provided,
			backgroundColor,
		}
	},
	indicatorsContainer: (provided, { isDisabled }) => {
		const color = isDisabled
			? 'rgba(var(--cui-color-rgb-50), var(--cui-opacity--low))'
			: 'rgb(var(--cui-color-rgb-50))'

		return {
			...provided,
			color,
			margin: 'calc(-1 * var(--cui-border-width, 1px)) 0',
			padding: '0 var(--cui-gap)',
		}
	},
	valueContainer: provided => {
		return {
			...provided,
			display: 'flex',
			gap: 'var(--cui-gap)',
			padding: '0 calc(var(--cui-gutter) - var(--cui-border-width))',
		}
	},
	placeholder: provided => {
		return {
			...provided,
			color: 'rgba(var(--cui-color-rgb-25), var(--cui-opacity--high))',
			margin: 0,
			position: 'absolute',
		}
	},
	singleValue: (provided, { isDisabled }) => {
		const color = isDisabled
			? 'rgba(var(--cui-color-rgb-50), var(--cui-opacity--low))'
			: 'rgb(var(--cui-color-strong-rgb-50))'

		return {
			...provided,
			color,
		}
	},
	multiValue: (provided, { isDisabled }) => {
		const borderColor = isDisabled ? 'rgba(var(--cui-color-rgb-50), var(--cui-opacity--low))' : 'rgb(var(--cui-background-color-toned-rgb-75))'
		const backgroundColor = isDisabled ? 'rgba(var(--cui-color-rgb-50), var(--cui-opacity--lower))' : 'rgba(var(--cui-background-color-toned-rgb-50), var(--cui-opacity--lower))'
		const borderWidth = 'var(--cui-border-width, 1px)'
		const lineHeight = 'var(--cui-line-height-controls)'
		const margin = 0
		const padding = '0 0 0 calc(var(--cui-gap) - var(--cui-border-width, 1px))'

		return {
			...provided,
			backgroundColor,
			borderColor,
			borderWidth,
			margin,
			padding,
			lineHeight,
			'&:hover': {
				borderColor: isDisabled ? borderColor : 'rgba(var(--cui-color-rgb-50), var(--cui-opacity--high))',
			},
			'&:first-child': {
				marginLeft: 'calc(-2 * var(--cui-gap) + 2 * var(--cui-border-width, 1px))',
			},
		}
	},
	multiValueLabel: (provided, { isDisabled }) => {
		const color = isDisabled ? 'rgba(var(--cui-color-rgb-50), var(--cui-opacity--low))' : 'rgb(var(--cui-color-strong-rgb-50))'

		return {
			...provided,
			color,
		}
	},
	multiValueRemove: provided => {
		const color = 'rgb(var(--cui-color-strong-rgb-50))'
		const colorHover = 'rgb(var(--cui-color-accent-rgb-75))'
		const backgroundColor = 'rgba(var(--cui-background-color-toned-controls-rgb-75), var(--cui-opacity--low))'

		// TODO: Indirect, but there seems to be no better way for now
		const isFocusing = provided.backgroundColor

		return {
			...provided,
			color,
			'backgroundColor': isFocusing ? backgroundColor : undefined,
			'opacity': isFocusing ? 1 : 0.5,
			'&:hover': {
				color: colorHover,
				backgroundColor,
				opacity: 1,
			},
		}
	},
	dropdownIndicator: (provided, { isFocused, isDisabled }) => {
		return {
			...provided,
			'alignSelf': 'stretch',
			'alignItems': 'center',
			'color': isDisabled
				? 'rgba(var(--cui-color-rgb-50), var(--cui-opacity--low))'
				: isFocused
					? 'rgb(var(--cui-color-rgb-0))'
					: 'rgb(var(--cui-color-rgb-50))',
			'padding': '0 var(--cui-gap)',
			'&:hover': {
				color: 'rgb(var(--cui-color-rgb-0))',
			},
		}
	},
	clearIndicator: (provided, { isFocused }) => {
		return {
			...provided,
			'color': isFocused
				? 'rgb(var(--cui-color-rgb-0))'
				: 'rgb(var(--cui-color-rgb-50))',
			'&:hover': {
				color: 'rgb(var(--cui-color-rgb-0))',
			},
		}
	},
	control: (provided, { isFocused, isDisabled }) => {
		const backgroundColor = 'rgba(var(--cui-background-color-rgb-25), var(--cui-opacity--medium))'
		const color = isDisabled
			? 'rgba(var(--cui-color-rgb-50), var(--cui-opacity--low))'
			: isFocused
				? 'rgb(var(--cui-color-rgb-0))'
				: 'rgb(var(--cui-color-rgb-50))'

		const borderColor = isInvalid
			? 'rgb(var(--cui-theme-danger-rgb-500))'
			: isDisabled
				? 'rgba(var(--cui-color-rgb-50), var(--cui-opacity--lower))'
				: 'rgb(var(--cui-background-color-toned-rgb-75))'

		return {
			...provided,
			backgroundColor,
			borderColor,
			'borderWidth': 'var(--cui-border-width, 1px)',
			color,
			'borderRadius': 'var(--cui-border-radius--controls)',
			'boxShadow': isFocused ? 'var(--cui-control-focus-ring-box-shadow)' : undefined,
			'minHeight': 'var(--cui-size-controls)',
			'&:hover': {
				color: 'rgb(var(--cui-color-rgb-0))',
				borderColor: isDisabled
					? 'rgba(var(--cui-color-rgb-50), var(--cui-opacity--low))'
					: 'rgba(var(--cui-color-rgb-50), var(--cui-opacity--high))',
			},
		}
	},
	menu: provided => {
		const backgroundColor = 'rgb(var(--cui-background-color-rgb-50))'
		const border = 'var(--cui-border-width, 1px) solid rgb(var(--cui-background-color-toned-rgb-75))'

		return {
			...provided,
			backgroundColor,
			border,
		}
	},
	menuList: provided => {
		return {
			...provided,
			display: 'flex',
			flexDirection: 'column',
			gap: 'var(--cui-gap)',
			padding: 'var(--cui-gap)',
			zIndex: menuZIndex ?? 'unset',
		}
	},
	menuPortal: provided => {
		return {
			...provided,
			zIndex: 150,
		}
	},
	option: (provided, { isFocused, isSelected }) => {
		return {
			...provided,
			'borderRadius': 'var(--cui-border-radius--controls)',
			'backgroundColor': isFocused
				? 'rgb(var(--cui-background-color-controls-rgb-75))'
				: isSelected
					? 'rgb(var(--cui-background-color-controls-rgb-100))'
					: 'transparent',
			'color': isFocused
				? 'rgb(var(--cui-color-controls-rgb-75))'
				: isSelected
					? 'rgb(var(--cui-color-controls-rgb-100))'
					: 'var(--cui-color-controls-rgb-50)',
			'lineHeight': 'var(--cui-line-height-controls)',
			'padding': 'calc(2 * var(--cui-gap))',
			'&:hover': {
				backgroundColor: isSelected
					? 'rgb(var(--cui-background-color-controls-rgb-100))'
					: 'rgb(var(--cui-background-color-controls-rgb-75))',
				color: isSelected
					? 'rgb(var(--cui-color-controls-rgb-100))'
					: 'rgb(var(--cui-color-controls-rgb-75))',
			},
		}
	},
}), [isInvalid, menuZIndex])
