import { FieldValue } from '@contember/binding'
import Fuse from 'fuse.js'
import { useMemo } from 'react'
import { Props as SelectProps } from 'react-select'
import { Props as AsyncProps } from 'react-select/async'
import { ChoiceFieldData } from '../ChoiceField'
import { VirtualizedMenuList } from './VirtualizedMenuList'

export interface UseCommonReactSelectAsyncPropsProps {
	reactSelectProps: Partial<SelectProps<any>> | undefined
	placeholder: string | undefined
	data: ChoiceFieldData.Data<FieldValue | undefined>
}

export const useCommonReactSelectAsyncProps = ({
	reactSelectProps,
	placeholder,
	data,
}: UseCommonReactSelectAsyncPropsProps): AsyncProps<ChoiceFieldData.SingleDatum<FieldValue | undefined>> => {
	const fuse = useMemo(
		() =>
			new Fuse(data, {
				keys: ['searchKeywords'],
			}),
		[data],
	)
	return {
		...reactSelectProps,
		placeholder,
		styles: {
			menu: base => ({
				...base,
				zIndex: 99,
			}),
		},
		loadOptions: (inputValue, callback) => {
			const result = fuse.search(inputValue)
			callback(result.map(item => item.item))
		},
		defaultOptions: data,
		getOptionValue: datum => datum.key.toFixed(),
		components:
			data.length > 100
				? {
						MenuList: VirtualizedMenuList,
				  }
				: {},
	}
}
