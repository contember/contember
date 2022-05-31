import type { StylesConfig } from 'react-select'
import { useMemo } from 'react'

// TODO: Not yet finished with all styles
export const useCommonStyles = (isInvalid: boolean): StylesConfig<any, boolean, never> => useMemo(() => ({
	indicatorSeparator: (provided, { isFocused, isDisabled }) => {
		const backgroundColor = isDisabled
			? 'var(--cui-color--lower)'
			: isFocused
				? 'var(--cui-color--low)'
				: 'var(--cui-color--lower)'

		return {
			...provided,
			backgroundColor,
		}
	},
	indicatorsContainer: (provided, { isDisabled }) => {
		const color = isDisabled
			? 'var(--cui-color--low)'
			: 'var(--cui-color)'

		return {
			...provided,
			color,
			'padding': '0 var(--cui-gap)',
		}
	},
	singleValue: (provided, { isDisabled }) => {
		const color = isDisabled
			? 'var(--cui-control-color)'
			: 'var(--cui-color-low)'

		return {
			...provided,
			color,
		}
	},
	multiValue: (provided, { isDisabled, isFocused }) => {
		const color = isDisabled ? 'var(--cui-color--low)' : 'var(--cui-filled-control-color)'
		const borderColor = isDisabled ? 'var(--cui-color--low)' : 'var(--cui-filled-control-border-color)'
		const backgroundColor = isDisabled ? 'var(--cui-color--lower)' : 'var(--cui-toned-control-background-color)'

		return {
			...provided,
			color,
			borderColor,
			backgroundColor,
		}
	},
	multiValueLabel: (provided, { isDisabled, isFocused }) => {
		const color = isDisabled ? 'var(--cui-color--high)' : 'var(--cui-filled-control-color)'

		return {
			...provided,
			color,
		}
	},
	multiValueRemove: provided => {
		const color = 'var(--cui-toned-control-color)'
		const backgroundColor = 'var(--cui-toned-control-background-color)'

		// TODO: Indirect, but there seens to be no better way for now
		const isFocusing = provided.backgroundColor

		return {
			...provided,
			color,
			'backgroundColor': isFocusing ? backgroundColor : undefined,
			'opacity': isFocusing ? 1 : 0.5,
			'&:hover': {
				color,
				backgroundColor,
				opacity: 1,
			},
		}
	},
	dropdownIndicator: (provided, { isFocused, isDisabled }) => {
		return {
			...provided,
			'align-self': 'stretch',
			'align-items': 'center',
			'color': isDisabled
				? 'var(--cui-color--low)'
				: isFocused
					? 'var(--cui-color--strong)'
					: 'var(--cui-color--high)',
			'padding': '0 var(--cui-gap)',
			'&:hover': {
				color: 'var(--cui-color--strong)',
			},
		}
	},
	clearIndicator: (provided, { isFocused }) => {
		return {
			...provided,
			'color': isFocused
					? 'var(--cui-color--strong)'
					: 'var(--cui-color--high)',
			'&:hover': {
				color: 'var(--cui-color--strong)',
			},
		}
	},
	control: (provided, { isFocused, isDisabled }) => {
		const backgroundColor = 'var(--cui-background-color--above)'
		const color = isDisabled
			? 'var(--cui-color--low)'
			: isFocused
				? 'var(--cui-color--strong)'
				: 'var(--cui-color)'

		const borderColor = isInvalid
			? 'rgb(var(--cui-theme-danger-500))'
			: isDisabled
				? 'var(--cui-color--lower)'
				: isFocused
					? 'var(--cui-color--low)'
					: 'var(--cui-color--lower)'

		return {
			...provided,
			backgroundColor,
			borderColor,
			'borderWidth': '0.0625em',
			color,
			'borderRadius': 'var(--cui-control-border-radius)',
			'boxShadow': isFocused ? 'var(--cui-control-focus-ring-box-shadow)' : undefined,
			'minHeight': 'var(--cui-control-height)',
			'&:hover': {
				backgroundColor: 'var(--cui-background-color--above)',
				color: 'var(--cui-color--strong)',
				borderColor: 'var(--cui-color--low)',
			},
		}
	},
	menu: (provided, props) => {
		const backgroundColor = 'var(--cui-background-color--above)'
		const border = 'var(--cui-control-border-width) solid var(--cui-color--lower)'

		return {
			...provided,
			backgroundColor,
			border,
		}
	},
	option: (provided, { isFocused, isSelected }) => {
		const color = isFocused
			? 'var(--cui-filled-control-color)'
			: isSelected
				? 'var(--cui-toned-control-color)'
				: 'var(--cui-control-color)'
		const backgroundColor = isFocused
			? 'var(--cui-filled-control-background-color)'
			: isSelected
				? 'var(--cui-toned-control-background-color)'
				: 'var(--cui-control-background-color)'

		return {
			...provided,
			backgroundColor,
			color,
		}
	},
	placeholder: provided => {
		return {
			...provided,
			position: 'absolute',
		}
	},
}), [isInvalid])
