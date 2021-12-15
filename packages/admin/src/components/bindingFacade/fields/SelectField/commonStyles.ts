import type { GroupTypeBase, OptionTypeBase, StylesConfig } from 'react-select'

// TODO: Not yet finished with all styles
export const selectStyles: StylesConfig<OptionTypeBase, boolean, GroupTypeBase<OptionTypeBase>> = {
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
	control: (provided, { isFocused, isDisabled }) => {
		const backgroundColor = isDisabled
			? 'var(--cui-toned-control-background-color)'
			: isFocused
				? 'var(--cui-background-color--above)'
				: 'var(--cui-background-color--above)'
		const color = isDisabled
			? 'var(--cui-color--low)'
			: isFocused
				? 'var(--cui-color--strong)'
				: 'var(--cui-color)'

		const borderColor = isDisabled
			? 'var(--cui-color--lower)'
			: isFocused
				? 'var(--cui-color--low)'
				: 'var(--cui-color--lower)'

		return {
			...provided,
			backgroundColor,
			borderColor,
			color,
			'borderRadius': 'var(--cui-control-border-radius)',
			'boxShadow': isFocused ? '0 0 0 0.2em var(--cui-control-border-color)' : undefined,
			'minHeight': 'var(--cui-control-height)',
			'&:hover': {
				backgroundColor: 'var(--cui-background-color--above)',
				color: 'var(--cui-color--strong)',
				borderColor: 'var(--cui-color--low)',
			},
		}
	},
}
