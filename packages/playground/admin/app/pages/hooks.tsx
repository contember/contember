import { Button } from '@app/lib/ui/button'
import { useContentMutation, useContentQuery } from '@contember/react-client-content'
import { queryBuilder } from '../../../api/client'

const listHooksValue = queryBuilder.list('HooksValue', {
	orderBy: [{ createdAt: 'asc' }],
}, it => it.$$())

export const ContentApi = () => {
	const [items, refreshList] = useContentQuery(listHooksValue)

	const [addItemState, addItemMutation] = useContentMutation(
		() =>
			queryBuilder.create('HooksValue', { data: { value: 0 } }),
		{ onResponse: refreshList },
	)

	const [updateValueState, updateValueMutation] = useContentMutation(
		(variables: { id: string; value: number }) =>
			queryBuilder.update('HooksValue', { by: { id: variables.id }, data: { value: variables.value } }),
		{ onResponse: refreshList },
	)

	const [deleteValueState, deleteValueMutation] = useContentMutation(
		(variables: { id: string }) =>
			queryBuilder.delete('HooksValue', { by: { id: variables.id } }),
		{ onResponse: refreshList },
	)

	const mutating = addItemState.state === 'loading' || updateValueState.state === 'loading' || deleteValueState.state === 'loading'

	return <>
		<div className="flex gap-2 mb-4 justify-end">
			<Button onClick={() => addItemMutation({})} disabled={mutating}>New item</Button>
			<Button onClick={refreshList} disabled={items.state === 'loading' || items.state === 'refreshing'}>Refresh</Button>
		</div>

		{'data' in items && items.data.map(item => (
			<div key={item.id} className="flex gap-2">
				<span>{item.value}</span>
				<Button size="sm" disabled={mutating} onClick={() => updateValueMutation({ id: item.id, value: item.value + 1 })}>+</Button>
				<Button size="sm" disabled={mutating} onClick={() => updateValueMutation({ id: item.id, value: item.value - 1 })}>-</Button>
				<Button size="sm" variant="destructive" disabled={mutating} onClick={() => deleteValueMutation({ id: item.id })}>Delete</Button>
			</div>
		))}
	</>
}
