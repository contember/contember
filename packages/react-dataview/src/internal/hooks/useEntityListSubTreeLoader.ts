import { createElement, ReactNode, useEffect, useRef, useState } from 'react'
import { EntityListSubTree, SugaredQualifiedEntityList, TreeRootId, useEnvironment, useExtendTree } from '@contember/react-binding'
import { DataViewState } from '../../types'

export type UseEntityListSubTreeLoaderResult<State extends DataViewState> = {
	entities: SugaredQualifiedEntityList | undefined
	treeRootId: TreeRootId | undefined
	state: State | undefined
}

export type DataViewLoaderState =
	| 'initial'
	| 'refreshing'
	| 'loaded'

export const useEntityListSubTreeLoader = <State extends DataViewState>(entities: SugaredQualifiedEntityList, children: ReactNode, state: State): [UseEntityListSubTreeLoaderResult<State>, DataViewLoaderState] => {
	const [displayedState, setDisplayedState] = useState<UseEntityListSubTreeLoaderResult<State>>({
		entities: undefined,
		treeRootId: undefined,
		state: undefined,
	})
	const currentlyLoading = useRef<{
		entities: SugaredQualifiedEntityList
		state: State
	}>()

	const [loadingState, setLoadingState] = useState<DataViewLoaderState>('initial')
	const environment = useEnvironment()
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

			setLoadingState('refreshing')
			const newTreeRootId = await extendTree(
				createElement(EntityListSubTree, {
					...entities,
					children,
				}),
			)
			currentlyLoading.current = undefined
			if (newTreeRootId) {
				setLoadingState('loaded')
				setDisplayedState({
					entities: entities,
					treeRootId: newTreeRootId,
					state: state,
				})
			}
		})()
	}, [displayedState, environment, extendTree, entities, children, state])

	return [displayedState, loadingState]
}
