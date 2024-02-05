import { createElement, ReactNode, useEffect, useRef, useState } from 'react'
import { SugaredQualifiedEntityList, TreeRootId } from '@contember/binding'
import { useExtendTree } from './useExtendTree'
import { EntityListSubTree } from '../coreComponents'

export type UseEntityListSubTreeLoaderResult<State> = {
	entities: SugaredQualifiedEntityList | undefined
	treeRootId: TreeRootId | undefined
	state: State | undefined
}

export type EntityListSubTreeLoaderState =
	| 'initial'
	| 'refreshing'
	| 'loaded'

export const useEntityListSubTreeLoader = <State>(entities: SugaredQualifiedEntityList, children: ReactNode, state?: State): [UseEntityListSubTreeLoaderResult<State>, EntityListSubTreeLoaderState] => {
	const [displayedState, setDisplayedState] = useState<UseEntityListSubTreeLoaderResult<State>>({
		entities: undefined,
		treeRootId: undefined,
		state: undefined,
	})
	const currentlyLoading = useRef<{
		entities: SugaredQualifiedEntityList
		state?: State
	}>()

	const [loadingState, setLoadingState] = useState<EntityListSubTreeLoaderState>('initial')
	const extendTree = useExtendTree()

	useEffect(() => {
		(async () => {
			if (
				displayedState.state === state && displayedState.entities === entities
				|| currentlyLoading.current?.entities === entities && currentlyLoading.current?.state === state
			) {
				return
			}

			currentlyLoading.current = {
				entities,
				state,
			}

			if (displayedState.entities) {
				setLoadingState('refreshing')
			}

			const newTreeRootId = await extendTree(
				createElement(EntityListSubTree, {
					...entities,
					children,
				}),
			)
			currentlyLoading.current = undefined
			if (newTreeRootId) {
				setDisplayedState({
					entities: entities,
					treeRootId: newTreeRootId,
					state: state,
				})
				setLoadingState('loaded')
			}
		})()
	}, [displayedState, extendTree, entities, children, state])

	return [displayedState, loadingState]
}
