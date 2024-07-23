import { createElement, ReactNode, useEffect, useRef, useState } from 'react'
import { SugaredQualifiedSingleEntity, TreeRootId } from '@contember/binding'
import { useExtendTree } from './useExtendTree'
import { EntitySubTree } from '../coreComponents'

export type UseEntitySubTreeLoaderResult<State> = {
	entity: SugaredQualifiedSingleEntity | undefined
	treeRootId: TreeRootId | undefined
	state: State | undefined
}

export type EntitySubTreeLoaderState =
	| 'initial'
	| 'refreshing'
	| 'loaded'

export const useEntitySubTreeLoader = <State>(entity: SugaredQualifiedSingleEntity | undefined, children: ReactNode, state?: State): [UseEntitySubTreeLoaderResult<State>, EntitySubTreeLoaderState] => {
	const [displayedState, setDisplayedState] = useState<UseEntitySubTreeLoaderResult<State>>({
		entity: undefined,
		treeRootId: undefined,
		state: undefined,
	})
	const currentlyLoading = useRef<{
		entity: SugaredQualifiedSingleEntity
		state?: State
	}>()

	const [loadingState, setLoadingState] = useState<EntitySubTreeLoaderState>('initial')
	const extendTree = useExtendTree()

	useEffect(() => {
		(async () => {
			if (
				!entity
				|| displayedState.state === state && displayedState.entity === entity
				|| currentlyLoading.current?.entity === entity && currentlyLoading.current?.state === state
			) {
				return
			}

			currentlyLoading.current = {
				entity,
				state,
			}

			if (displayedState.entity) {
				setLoadingState('refreshing')
			}

			const newTreeRootId = await extendTree(
				createElement(EntitySubTree, {
					...entity,
					children,
				}),
			)
			currentlyLoading.current = undefined
			if (newTreeRootId) {
				setDisplayedState({
					entity: entity,
					treeRootId: newTreeRootId,
					state: state,
				})
				setLoadingState('loaded')
			}
		})()
	}, [displayedState, extendTree, entity, children, state])

	return [displayedState, loadingState]
}
