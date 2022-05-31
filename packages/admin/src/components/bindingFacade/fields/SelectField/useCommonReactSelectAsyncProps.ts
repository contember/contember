import type { FieldValue } from '@contember/binding'
import Fuse from 'fuse.js'
import { useMemo } from 'react'
import type { Props as SelectProps } from 'react-select'
import type { AsyncProps } from 'react-select/async'
import type { ChoiceFieldData } from '../ChoiceField'
import { SearchInput } from './SearchInput'
import { VirtualizedMenuList } from './VirtualizedMenuList'

export interface UseCommonReactSelectAsyncPropsProps {
	reactSelectProps: Partial<SelectProps<any, any, any>> | undefined
	placeholder: string | undefined
	data: ChoiceFieldData.Data<FieldValue | undefined>
	isInvalid: boolean
}

export const useCommonReactSelectAsyncProps = ({
	reactSelectProps,
	placeholder,
	data,
	isInvalid,
}: UseCommonReactSelectAsyncPropsProps): AsyncProps<ChoiceFieldData.SingleDatum<FieldValue | undefined>, boolean, never> => {
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
			control: base =>
				isInvalid
					? {
							...base,
							'borderColor': '#FF312E',
							'&:hover': {
								borderColor: '#FF312E',
							},
					  }
					: base,
		},
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
