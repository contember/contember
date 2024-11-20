import { createElement, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { SugaredQualifiedEntityList, TreeRootId } from '@contember/binding'
import { useExtendTree } from './useExtendTree'
import { EntityListSubTree } from '../coreComponents'
import { useEnvironment } from './useEnvironment'
import { useObjectMemo } from '@contember/react-utils'

export type UseEntityListSubTreeLoaderStateInitial = {
	state: 'initial'
	entities: undefined
	treeRootId: undefined
	customState: undefined
	isLoading: false
}

export type UseEntityListSubTreeLoaderStateLoading = {
	state: 'loading'
	entities: undefined
	treeRootId: undefined
	customState: undefined
	isLoading: true
}

export type UseEntityListSubTreeLoaderStateRefreshing<State> = {
	state: 'refreshing'
	entities: SugaredQualifiedEntityList
	treeRootId: TreeRootId | undefined
	customState: State
	isLoading: true
}


export type UseEntityListSubTreeLoaderStateLoaded<State> = {
	state: 'loaded'
	entities: SugaredQualifiedEntityList
	treeRootId: TreeRootId | undefined
	customState: State
	isLoading: false
}


export type UseEntityListSubTreeLoaderState<State> =
	| UseEntityListSubTreeLoaderStateInitial
	| UseEntityListSubTreeLoaderStateLoading
	| UseEntityListSubTreeLoaderStateRefreshing<State>
	| UseEntityListSubTreeLoaderStateLoaded<State>

export type UseEntityListSubTreeLoaderStateMethods = {
	reload: () => void
}

const emptyObject = {} as SugaredQualifiedEntityList

export const useEntityListSubTreeLoader = <State>(entities: SugaredQualifiedEntityList | undefined, children: ReactNode, state?: State): [UseEntityListSubTreeLoaderState<State>, UseEntityListSubTreeLoaderStateMethods] => {
	const [displayedState, setDisplayedState] = useState<UseEntityListSubTreeLoaderState<State>>({
		state: 'initial',
		isLoading: false,
		entities: undefined,
		treeRootId: undefined,
		customState: undefined,
	})
	const currentlyLoading = useRef<{
		entities: SugaredQualifiedEntityList
		state?: State
	}>()

	const extendTree = useExtendTree()
	const [reloadTrigger, setReloadTrigger] = useState<object | null>(null)
	const memoizedEntities = useObjectMemo(entities ?? emptyObject)
	const resolvedEntities = entities ? memoizedEntities : undefined

	useEffect(() => {
		(async () => {
			if (!resolvedEntities) {
				return
			}

			currentlyLoading.current = {
				entities: resolvedEntities,
				state,
			}

			setDisplayedState(it => {
				if (it.state === 'initial' || it.state === 'loading') {
					return {
						...it,
						isLoading: true,
						state: 'loading',
					}
				} else {
					return {
						...it,
						isLoading: true,
						state: 'refreshing',
					}
				}
			})

			const newTreeRootId = await extendTree(
				createElement(EntityListSubTree, {
					...resolvedEntities,
					children,
				}),
				{ force: reloadTrigger !== null },
			)
			if (currentlyLoading.current?.entities !== resolvedEntities || currentlyLoading.current?.state !== state) {
				return
			}
			currentlyLoading.current = undefined
			if (newTreeRootId) {
				setDisplayedState({
					entities: resolvedEntities,
					treeRootId: newTreeRootId,
					state: 'loaded',
					customState: state as State,
					isLoading: false,
				})
			}
		})()
	}, [extendTree, resolvedEntities, children, state, reloadTrigger])

	return [
		displayedState,
		{
			reload: useCallback(() => setReloadTrigger({}), []),
		},
	]
}
