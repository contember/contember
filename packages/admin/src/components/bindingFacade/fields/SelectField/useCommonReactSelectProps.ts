import type { Props as SelectProps } from 'react-select'
import { useStateManager } from 'react-select'
import type { ChoiceFieldData } from '../ChoiceField'
import { SearchInput } from './SearchInput'
import { CommonReactSelectStylesProps, useCommonReactSelectStyles } from './useCommonReactSelectStyles'

export interface UseCommonReactSelectPropsProps<T> extends Omit<CommonReactSelectStylesProps, 'isInvalid'> {
	reactSelectProps: Partial<SelectProps<any, any, any>> | undefined
	placeholder: string | undefined
	data: ChoiceFieldData.Options<T>
	isInvalid: boolean
	onSearch?: (input: string) => void
}

export const useCommonReactSelectProps = <T>({
	reactSelectProps,
	placeholder,
	data,
	isInvalid,
	menuZIndex,
	onSearch,
}: UseCommonReactSelectPropsProps<T>): SelectProps<ChoiceFieldData.SingleOption<T>, boolean, never> => {
	const styles = useCommonReactSelectStyles({ isInvalid, menuZIndex })
	const reactSelectState = useStateManager<ChoiceFieldData.SingleOption<T>, boolean, never, {}>({
		onInputChange: onSearch,
		onFocus: e => {
			onSearch?.(e.target.value)
		},
	})
	return {
		...reactSelectProps,
		...reactSelectState,
		placeholder,
		styles,
		options: data,
		getOptionValue: datum => datum.key,
		components: {
			Input: SearchInput,
		},
		filterOption: () => true,
	}
}
