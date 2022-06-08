import { BaseDynamicChoiceField } from '../BaseDynamicChoiceField'
import { EntityAccessor, Filter, TreeRootId, useEnvironment, useExtendTree, useTreeRootId } from '@contember/binding'
import { ChoiceFieldData } from '../ChoiceFieldData'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDesugaredOptionPath } from './useDesugaredOptionPath'
import { useTopLevelOptionAccessors } from './useTopLevelOptionAccessor'
import { useNormalizedOptions } from './useNormalizedOptions'
import { useDebounce } from '@contember/react-utils'
import { renderDynamicChoiceFieldStatic } from '../renderDynamicChoiceFieldStatic'
import { useCreateOptionsFilter } from './useCreateOptionsFilter'
import Fuse from 'fuse.js'

type OnSearch = (input: string) => void

interface SelectOptions {
	options: ChoiceFieldData.Options<EntityAccessor>,
	allOptions: ChoiceFieldData.Options<EntityAccessor>,
	onSearch: OnSearch,
	isLoading: boolean
}

export const useSelectOptions = (
	optionProps: BaseDynamicChoiceField,
	additionalAccessors: EntityAccessor[] = [],
): SelectOptions => {
	const [input, setSearchInput] = useState<string | undefined>(undefined)
	const { renderedState, isLoading } = useOptionsLoader(optionProps, input)
	const desugaredOptionPath = useDesugaredOptionPath(optionProps, renderedState.filter)

	const topLevelOptionAccessors = useTopLevelOptionAccessors(desugaredOptionPath, renderedState.treeRootId)
	const mergedEntities = useMergedEntities(topLevelOptionAccessors, additionalAccessors)

	const options = useNormalizedOptions(mergedEntities, desugaredOptionPath, optionProps)
	const fuseFilteredOptions = useFuseFilteredOptions(optionProps, options, input)
	const transformedOptions = useCustomTransformedOptions(optionProps, fuseFilteredOptions, input)
	const slicedOptions = useSlicedOptions(optionProps, transformedOptions)

	return {
		options: slicedOptions,
		allOptions: options,
		onSearch: setSearchInput,
		isLoading,
	}
}

const useMergedEntities = (
	topLevelOptionAccessors: EntityAccessor[],
	additionalAccessors: EntityAccessor[],
) => {
	return useMemo(() => {
		const ids = new Set(topLevelOptionAccessors.map(it => it.id))
		return [
			...topLevelOptionAccessors,
			...additionalAccessors.filter(it => !ids.has(it.id)),
		]
	}, [additionalAccessors, topLevelOptionAccessors])
}

const useFuseFilteredOptions = (
	optionProps: BaseDynamicChoiceField,
	options: ChoiceFieldData.Options<EntityAccessor>,
	input: string | undefined,
) => {
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

const useCustomTransformedOptions = (
	optionProps: BaseDynamicChoiceField,
	options: ChoiceFieldData.Options<EntityAccessor>,
	input: string | undefined,
) => {
	const transformFn = optionProps.transformOptions
	return useMemo(() => {
		return transformFn?.(options, input) ?? options
	}, [transformFn, options, input])
}

const RENDERED_OPTIONS_LIMIT = 100

const useSlicedOptions = (
	optionProps: BaseDynamicChoiceField,
	options: ChoiceFieldData.Options<EntityAccessor>,
) => {
	const renderedLimit = optionProps.renderedOptionsLimit ?? RENDERED_OPTIONS_LIMIT
	return useMemo(() => {
		if (renderedLimit === 0) {
			return options
		}
		return options.slice(0, renderedLimit)
	}, [options, renderedLimit])
}


interface OptionsLoaderRenderedState {
	treeRootId: TreeRootId | undefined,
	filter: Filter | undefined
	query: string | undefined
}


const useOptionsLoader = (
	optionProps: BaseDynamicChoiceField,
	input: string | undefined,
): {
	renderedState: OptionsLoaderRenderedState,
	isLoading: boolean,
} => {
	const delay = typeof optionProps.lazy === 'object' ? optionProps.lazy.inputDebounceDelay : null
	const debouncedInput = useDebounce(input, delay ?? 250)
	const inputRef = useRef(input)
	useEffect(() => {
		inputRef.current = input
	}, [input])

	const [renderedState, setRenderedState] = useState<OptionsLoaderRenderedState>({
		treeRootId: useTreeRootId(),
		filter: undefined,
		query: undefined,
	})

	const desugaredOptionPath = useDesugaredOptionPath(optionProps, undefined)

	const extendTree = useExtendTree()
	const environment = useEnvironment()
	const createFilter = useCreateOptionsFilter(desugaredOptionPath, optionProps.searchByFields, optionProps.lazy)
	const isEmptyInit = typeof optionProps.lazy === 'object' && optionProps.lazy.initialLimit === 0
	useEffect(() => {
		if (input === '' && !isEmptyInit) {
			setRenderedState({
				treeRootId: undefined,
				filter: undefined,
				query: '',
			})
		}
	}, [input, isEmptyInit])

	useEffect(() => {
		if (
			!optionProps.lazy
			|| debouncedInput === renderedState.query
			|| debouncedInput !== inputRef.current
			|| debouncedInput === undefined
		) {
			return
		}
		if (debouncedInput === '' && !isEmptyInit) {
			return
		}

		(async () => {
			const filter = debouncedInput === '' ? {} : createFilter(debouncedInput)
			const { subTree } = renderDynamicChoiceFieldStatic({
				...optionProps,
				createNewForm: undefined,
			}, environment, filter)
			const treeRootId = await extendTree(subTree)

			if (treeRootId && inputRef.current === debouncedInput) {
				setRenderedState({
					filter,
					treeRootId,
					query: debouncedInput,
				})
			}
		})()
	}, [createFilter, debouncedInput, environment, extendTree, isEmptyInit, optionProps, renderedState.query])

	return {
		renderedState,
		isLoading: !!optionProps.lazy && renderedState.query !== input,
	}
}
