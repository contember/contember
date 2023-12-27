import {
	Board,
	BoardColumnRendererProps,
	Button,
	DataBindingProvider,
	FeedbackRenderer,
	Field,
	PersistButton,
	SelectField,
	Stack,
	TextField,
	TextInput,
} from '@contember/admin'
import { SlotSources } from '../components/Slots'
import { useState } from 'react'

const CreateTask = ({ boardMethods: { addItem } = {}, value }: BoardColumnRendererProps) => {
	const [input, setInput] = useState('')

	return <form>
		<Stack horizontal>
			<TextInput value={input} onChange={it => setInput(it ?? '')} notNull />
			<Button onClick={() => {
				addItem?.(value?.value, undefined, it => {
					it().getField('title').updateValue(input)
				})
				setInput('')
			}}>Create</Button>
		</Stack>
	</form>
}


export default () => {
	return (<>
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<SlotSources.Actions><PersistButton /></SlotSources.Actions>
			<Board
				entities={'Task'}

				columns={'User'}
				columnsSortableBy={'order'}
				columnLabel={<Field field={'name'} />}
				columnFooter={CreateTask}

				discriminationField={'assignee'}

				nullColumnLabel={'Unassigned'}
				nullColumnPlacement={'start'}
				nullColumn={'always'}

				sortableBy={'order'}
				sortScope={'board'}
			>
				<TextField field={'title'} label={'Title'} />
				<SelectField field={'status'} label={'Status'} options={[
					{ value: 'new', label: 'New' },
					{ value: 'in_progress', label: 'In progress' },
					{ value: 'done', label: 'Done' },
				]} />
				<SelectField
					field={'assignee'}
					label={'Assignee'}
					options={'User.name'}
					createNewForm={<>
						<TextField field={'name'} label={'Name'} />
					</>} allowNull
				/>
			</Board>

			<Board
				entities={'Task'}

				columns={[
					{ value: 'new', label: 'New' },
					{ value: 'in_progress', label: 'In progress' },
					{ value: 'done', label: 'Done' },
				]}
				columnFooter={CreateTask}

				discriminationField={'status'}

				sortableBy={'order'}
				sortScope={'board'}

				nullColumnLabel={'Without status'}
				nullColumn={'always'}
				nullColumnPlacement={'end'}
			>
				<TextField field={'title'} label={'Title'} />
				<SelectField field={'status'} label={'Status'} options={[
					{ value: 'new', label: 'New' },
					{ value: 'in_progress', label: 'In progress' },
					{ value: 'done', label: 'Done' },
				]} />
				<SelectField
					field={'assignee'}
					label={'Assignee'}
					options={'User.name'}
					createNewForm={<>
						<TextField field={'name'} label={'Name'} />
					</>} allowNull
				/>
			</Board>
		</DataBindingProvider>

		{/*<MultiEditScope entities={'Task'}>*/}
		{/*	<SlotSources.Actions><PersistButton /></SlotSources.Actions>*/}
		{/*	<TextField field={'title'} label={'Title'} />*/}
		{/*	<SelectField field={'status'} label={'Status'} options={[*/}
		{/*		{ value: 'new', label: 'New' },*/}
		{/*		{ value: 'in_progress', label: 'In progress' },*/}
		{/*		{ value: 'done', label: 'Done' },*/}
		{/*	]} />*/}
		{/*	<SelectField field={'assignee'} label={'Assignee'} options={'User.name'}*/}
		{/*				 createNewForm={<>*/}
		{/*					 <TextField field={'name'} label={'Name'} />*/}
		{/*				 </>}*/}

		{/*	/>*/}
		{/*</MultiEditScope>*/}
	</>)
}
