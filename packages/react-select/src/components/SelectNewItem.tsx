import { Entity, EntityAccessor, EntitySubTree, QueryLanguage, TreeRootId, TreeRootIdProvider, useEnvironment, useExtendTree, useGetEntitySubTree } from '@contember/react-binding'
import * as React from 'react'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useSelectOptions } from '../contexts'

export const SelectNewItem = ({ children }: { children: ReactNode }) => {
	const options = useSelectOptions()
	const env = useEnvironment()
	const { entityName } = useMemo((() => QueryLanguage.desugarQualifiedEntityList({ entities: options }, env)), [env, options])

	const [state, setState] = useState<{ entity: EntityAccessor, treeRootId: TreeRootId } | null>(null)
	const extendTree = useExtendTree()
	const getSubTree = useGetEntitySubTree()

	useEffect(() => {
		(async () => {
			const treeRootId = await extendTree(<>
				<EntitySubTree entity={{
					entityName,
				}} expectedMutation={'none'} isUnpersisted isCreating>
					{children}
				</EntitySubTree>
			</>)
			if (!treeRootId) {
				return
			}

			const entity = getSubTree({
				entity: {
					entityName: entityName,
				},
				isCreating: true,
			}, treeRootId)
			setState({
				entity,
				treeRootId,
			})
		})()
	}, [children, entityName, extendTree, getSubTree])

	if (!state) {
		return null
	}

	return (
		<>
			<TreeRootIdProvider treeRootId={state.treeRootId}>
				<Entity accessor={state.entity}>
					{children}
				</Entity>
			</TreeRootIdProvider>
		</>
	)
}
