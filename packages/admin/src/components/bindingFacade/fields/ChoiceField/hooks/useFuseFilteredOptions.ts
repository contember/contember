import { ChoiceFieldData } from '../ChoiceFieldData'
import { useMemo } from 'react'
import Fuse from 'fuse.js'

export interface SelectFuseOptionsProps<T> {
	fuseOptions?:
		| Fuse.IFuseOptions<ChoiceFieldData.SingleDatum<T>>
		| boolean
}

export const useFuseFilteredOptions = <T>(
	optionProps: SelectFuseOptionsProps<T>,
	options: ChoiceFieldData.Data<T>,
	input: string,
): ChoiceFieldData.Data<T> => {
	const fuseOpts = optionProps.fuseOptions ?? true
	const fuse = useMemo(
		() => {
			if (!options.some(it => it.searchKeywords !== '')) {
				return undefined
			}
			if (!fuseOpts) {
				return undefined
			}
			return new Fuse(options, {
				...(fuseOpts === true ? {} : fuseOpts),
				keys: ['searchKeywords'],
			})
		},
		[fuseOpts, options],
	)
	return useMemo(() => {
		return (input && fuse ? fuse.search(input).map(it => it.item) : options)
	}, [fuse, input, options])
}
