import {
	AccessorTree,
	Entity,
	EntityAccessor,
	NIL_UUID,
	useAccessorTreeState,
	useGetEntityListSubTree,
} from '@contember/binding'
import { BaseDynamicChoiceField, useDesugaredOptionPath } from './BaseDynamicChoiceField'
import { useMemo } from 'react'
import { Button, ButtonList, Stack, useDialog } from '@contember/ui'
import { useMessageFormatter } from '../../../../i18n'
import { choiceFieldDictionary } from './choiceFieldDictionary'

export const useOnAddNew = ({ createNewForm, connect, ...props }: BaseDynamicChoiceField & { connect: (entity: EntityAccessor) => void }) => {
	const desugaredOptionPath = useDesugaredOptionPath(props)
	const getSubTree = useGetEntityListSubTree()
	const dialog = useDialog<true>()
	const localization = useMessageFormatter(choiceFieldDictionary)

	const accessorTreeState = useAccessorTreeState()
	return useMemo(() => {
			if (!createNewForm) {
				return undefined
			}
			return async () => {
				const subTree = getSubTree({
					entities: {
						entityName: desugaredOptionPath.entityName,
						filter: { id: { eq: NIL_UUID } },
					},
				})
				const newEntityId = subTree.createNewEntity()
				const entity = subTree.getChildEntityById(newEntityId.value)

				const result = await dialog.openDialog({
					heading: localization('choiceField.createNew.dialogTitle'),
					content: contentProps => (
						<Stack direction="vertical">
							<AccessorTree state={accessorTreeState}>
								<Entity accessor={entity}>{createNewForm}</Entity>
							</AccessorTree>
							<ButtonList>
								<Button onClick={() => contentProps.resolve(true)}>{localization('choiceField.createNew.confirmButtonText')}</Button>
								<Button onClick={() => contentProps.resolve()} intent={'tertiary'}>{localization('choiceField.createNew.cancelButtonText')}</Button>
							</ButtonList>
						</Stack>
					),
				})
				if (result === true) {
					const entityToConnect = entity.getAccessor()
					connect(entityToConnect)
					subTree.disconnectAll()
				} else {
					entity.deleteEntity()
				}
			}
		}, [createNewForm, getSubTree, desugaredOptionPath.entityName, dialog, accessorTreeState, localization, connect],
	)
}
