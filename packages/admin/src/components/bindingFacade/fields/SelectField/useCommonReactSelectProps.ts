import type { Props as SelectProps } from 'react-select'
import type { ChoiceFieldData } from '../ChoiceField'
import { SearchInput } from './SearchInput'
import { VirtualizedMenuList } from './VirtualizedMenuList'
import { useCommonStyles } from './useCommonStyles'

export interface UseCommonReactSelectPropsProps {
	reactSelectProps: Partial<SelectProps<any, any, any>> | undefined
	placeholder: string | undefined
	data: ChoiceFieldData.Data
	isInvalid: boolean
}

export const useCommonReactSelectProps = ({
	reactSelectProps,
	placeholder,
	data,
	isInvalid,
}: UseCommonReactSelectPropsProps): SelectProps<ChoiceFieldData.SingleDatum, boolean, never> => {
	const styles = useCommonStyles(isInvalid)
	return {
		...reactSelectProps,
		placeholder,
		styles,
		options: data,
		getOptionValue: datum => datum.key.toFixed(),
		components: {
			...(data.length > 100
				? {
						MenuList: VirtualizedMenuList,
				  }
				: {}),
			Input: SearchInput,
		},
	}
}
