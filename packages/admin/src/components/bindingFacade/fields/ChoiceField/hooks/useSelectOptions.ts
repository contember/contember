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

const RENDERED_OPTIONS_LIMIT = 100

export const useSelectOptions = (
	optionProps: BaseDynamicChoiceField,
	additionalAccessors: EntityAccessor[] = [],
): { options: ChoiceFieldData.Data<EntityAccessor>, onSearch: OnSearch, isLoading: boolean } => {
	const [input, setSearchInput] = useState('')
	const renderedStateInputValueRef = useRef('')
	const debouncedInput = useDebounce(input, 250)
	const inputRef = useRef(debouncedInput)
	useEffect(() => {
		inputRef.current = input
	}, [input])

	const environment = useEnvironment()
	const [renderedState, setRenderedState] = useState<{ treeRootId: TreeRootId | undefined, filter: Filter | undefined }>({
		treeRootId: useTreeRootId(),
		filter: undefined,
	})

	const desugaredOptionPath = useDesugaredOptionPath(optionProps, renderedState.filter)

	const topLevelOptionAccessors = useTopLevelOptionAccessors(desugaredOptionPath, renderedState.treeRootId)

	const extendTree = useExtendTree()
	const createFilter = useCreateOptionsFilter(desugaredOptionPath, optionProps.searchByFields, optionProps.lazy)

	useEffect(() => {
		if (input === '') {
			renderedStateInputValueRef.current = ''
			setRenderedState({
				treeRootId: undefined,
				filter: undefined,
			})
		}
	}, [input])

	useEffect(() => {
		if (!optionProps.lazy) {
			return
		}
		if (debouncedInput === renderedStateInputValueRef.current || debouncedInput === '' || debouncedInput !== inputRef.current) {
			return
		}
		(async () => {
			const filter = createFilter(debouncedInput)
			const { subTree } = renderDynamicChoiceFieldStatic({
				...optionProps,
				createNewForm: undefined,
			}, environment, filter)
			const treeRootId = await extendTree(subTree)

			if (treeRootId && debouncedInput === inputRef.current) {
				renderedStateInputValueRef.current = debouncedInput
				setRenderedState({
					treeRootId,
					filter,
				})
			}
		})()
	}, [createFilter, debouncedInput, environment, extendTree, optionProps])
	const mergedEntities = useMemo(() => {
		const ids = new Set(topLevelOptionAccessors.map(it => it.id))
		return [
			...topLevelOptionAccessors,
			...additionalAccessors.filter(it => !ids.has(it.id)),
		]
	}, [additionalAccessors, topLevelOptionAccessors])

	const options = useNormalizedOptions(
		mergedEntities,
		desugaredOptionPath,
		optionProps,
	)
	const fuse = useMemo(
		() =>
			options.some(it => it.searchKeywords !== '') ? new Fuse(options, {
				keys: ['searchKeywords'],
			}) : undefined,
		[options],
	)
	const filteredOptions = useMemo(() => {

		return (input && fuse ? fuse.search(input).map(it => it.item) : options).slice(0, RENDERED_OPTIONS_LIMIT)
	}, [fuse, input, options])

	return {
		options: filteredOptions,
		onSearch: setSearchInput,
		isLoading: renderedStateInputValueRef.current !== input,
	}
}

