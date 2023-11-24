import {
	AccessorTree,
	Entity,
	EntityAccessor,
	EntitySubTree,
	TreeRootIdProvider,
	useAccessorTreeState,
	useEnvironment,
	useExtendTree,
	useGetEntitySubTree,
} from '@contember/react-binding'
import { Button, Stack, useDialog } from '@contember/ui'
import { useMessageFormatter } from '@contember/react-i18n'
import { ReactElement, useMemo } from 'react'
import { choiceFieldDictionary } from '../dict/choiceFieldDictionary'
import { BaseDynamicChoiceField, renderDynamicChoiceFieldStatic, useDesugaredOptionPath } from '@contember/react-choice-field'

type OnClickCallback = (() => void) | undefined;

export const useOpenCreateNewDialog = ({ createNewForm, connect, ...props }: BaseDynamicChoiceField & {
	connect: (entity: EntityAccessor) => void
	createNewForm?: ReactElement
}): OnClickCallback => {
	const dialog = useDialog<true>()
	const localization = useMessageFormatter(choiceFieldDictionary)
	const desugaredOptionPath = useDesugaredOptionPath(props, undefined)
	const accessorTreeState = useAccessorTreeState()
	const extendTree = useExtendTree()
	const environment = useEnvironment()

	const getSubTree = useGetEntitySubTree()

	return useMemo(() => {
		if (!createNewForm) {
			return undefined
		}

		return async () => {
			const { renderedOption } = renderDynamicChoiceFieldStatic(props, environment)

			const treeRootId = await extendTree(<>
				<EntitySubTree entity={{
					entityName: desugaredOptionPath.entityName,
				}} expectedMutation={'none'} isUnpersisted isCreating>
					{createNewForm}
					{renderedOption}
				</EntitySubTree>
			</>)
			if (!treeRootId) {
				return
			}

			const entity = getSubTree({
				entity: {
					entityName: desugaredOptionPath.entityName,
				},
				isCreating: true,
			}, treeRootId)
			const result = await dialog.openDialog({
				heading: localization('choiceField.createNew.dialogTitle'),
					content: contentProps => (
						<Stack>
							<AccessorTree state={accessorTreeState}>
								<TreeRootIdProvider treeRootId={treeRootId}>
									<Entity accessor={entity}>
										{createNewForm}
									</Entity>
								</TreeRootIdProvider>
							</AccessorTree>
							<Stack horizontal evenly>
							</Stack>
						</Stack>
					),
					footer: contentProps => (
						<Stack grow evenly horizontal>
							<Button onClick={() => contentProps.resolve()}>{localization('choiceField.createNew.cancelButtonText')}</Button>
							<Button onClick={() => contentProps.resolve(true)} distinction="primary">{localization('choiceField.createNew.confirmButtonText')}</Button>
						</Stack>
					),
			}) ?? false

			if (result === true) {
				const entityToConnect = entity.getAccessor()
				connect(entityToConnect)
			}
		}
	}, [accessorTreeState, connect, createNewForm, desugaredOptionPath.entityName, dialog, environment, extendTree, getSubTree, localization, props])
}
