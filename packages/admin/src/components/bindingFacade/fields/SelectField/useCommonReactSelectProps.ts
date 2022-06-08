import type { Props as SelectProps } from 'react-select'
import type { ChoiceFieldData } from '../ChoiceField'
import { SearchInput } from './SearchInput'
import { useCommonStyles } from './useCommonStyles'
import { useStateManager } from 'react-select'

export interface UseCommonReactSelectPropsProps<T> {
	reactSelectProps: Partial<SelectProps<any, any, any>> | undefined
	placeholder: string | undefined
	data: ChoiceFieldData.Data<T>
	isInvalid: boolean
	onSearch?: (input: string) => void
}

export const useCommonReactSelectProps = <T>({
	reactSelectProps,
	placeholder,
	data,
	isInvalid,
	onSearch,
}: UseCommonReactSelectPropsProps<T>): SelectProps<ChoiceFieldData.SingleDatum<T>, boolean, never> => {
	const styles = useCommonStyles(isInvalid)
	const reactSelectState = useStateManager<ChoiceFieldData.SingleDatum<T>, boolean, never, {}>({
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
