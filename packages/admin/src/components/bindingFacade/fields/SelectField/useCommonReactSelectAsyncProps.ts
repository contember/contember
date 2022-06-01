import Fuse from 'fuse.js'
import { useMemo } from 'react'
import type { Props as SelectProps } from 'react-select'
import type { AsyncProps } from 'react-select/async'
import type { ChoiceFieldData } from '../ChoiceField'
import { SearchInput } from './SearchInput'
import { VirtualizedMenuList } from './VirtualizedMenuList'
import { useCommonStyles } from './useCommonStyles'

export interface UseCommonReactSelectAsyncPropsProps {
	reactSelectProps: Partial<SelectProps<any, any, any>> | undefined
	placeholder: string | undefined
	data: ChoiceFieldData.Data
	isInvalid: boolean
}

export const useCommonReactSelectAsyncProps = ({
	reactSelectProps,
	placeholder,
	data,
	isInvalid,
}: UseCommonReactSelectAsyncPropsProps): AsyncProps<ChoiceFieldData.SingleDatum, boolean, never> => {
	const fuse = useMemo(
		() =>
			new Fuse(data, {
				keys: ['searchKeywords'],
			}),
		[data],
	)
	const styles = useCommonStyles(isInvalid)
	return {
		...reactSelectProps,
		placeholder,
		styles,
		loadOptions: (inputValue, callback) => {
			const result = fuse.search(inputValue)
			callback(result.map(item => item.item))
		},
		defaultOptions: data,
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
