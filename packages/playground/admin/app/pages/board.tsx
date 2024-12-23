import { Binding, PersistButton, PersistOnFieldChange } from '~/lib/binding'
import { DefaultBoard } from '~/lib/board/board'
import { Slots } from '~/lib/layout'
import { Field } from '@contember/interface'
import { BoardColumnLabel } from '@contember/react-board'

const statusList = [
	{ value: 'backlog', label: 'Backlog' },
	{ value: 'todo', label: 'To do' },
	{ value: 'inProgress', label: 'In progress' },
	{ value: 'done', label: 'Done' },
]

export const Assignee = () => <>
	<Binding>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

		<DefaultBoard
			entities="BoardTask"
			columns="BoardUser"
			columnsSortableBy="order"
			discriminationField="assignee"
			sortableBy="order"
			sortScope="board"
			columnHeader={
				<div className="text-lg font-semibold">
					<Field field="name" />
				</div>
			}
			nullColumnHeader={
				<div className="text-lg font-semibold italic">
					Without assignee
				</div>}
		>
			<Field field="title" />
		</DefaultBoard>
	</Binding>
</>
export const Status = () => <>
	<Binding>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

		<DefaultBoard
			entities="BoardTask"
			columns={statusList}
			discriminationField="status"
			sortableBy="order"
			sortScope="board"
			columnHeader={
				<div className="text-lg font-semibold">
					<BoardColumnLabel />
				</div>
			}
			nullColumnHeader={
				<div className="text-lg font-semibold italic">
					Without status
				</div>}
		>
			<PersistOnFieldChange field="status" />
			<PersistOnFieldChange field="order" />
			<Field field="title" />
		</DefaultBoard>
	</Binding>
</>
