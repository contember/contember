import type { Props as SelectProps } from 'react-select'
import type { ChoiceFieldData } from '../ChoiceField'
import { SearchInput } from './SearchInput'
import { useCommonStyles } from './useCommonStyles'

export interface UseCommonReactSelectPropsProps<T> {
	reactSelectProps: Partial<SelectProps<any, any, any>> | undefined
	placeholder: string | undefined
	data: ChoiceFieldData.Data<T>
	isInvalid: boolean
}

export const useCommonReactSelectProps = <T>({
	reactSelectProps,
	placeholder,
	data,
	isInvalid,
}: UseCommonReactSelectPropsProps<T>): SelectProps<ChoiceFieldData.SingleDatum<T>, boolean, never> => {
	const styles = useCommonStyles(isInvalid)
	return {
		...reactSelectProps,
		placeholder,
		styles,
		options: data,
		getOptionValue: datum => datum.key,
		components: {
			Input: SearchInput,
		},
	}
}
