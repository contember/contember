import { GripVertical } from 'lucide-react'
import { Title } from '~/app/components/title'
import { Binding, DeleteEntityDialog, PersistButton } from '~/lib/binding'
import { Slots } from '~/lib/layout'
import { EntitySubTree, Field } from '@contember/interface'
import { DefaultRepeater, RepeaterItemActions, RepeaterRemoveItemButton } from '~/lib/repeater'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropDownTriggerButton } from '~/lib/ui/dropdown'
import { InputField, SelectField } from '~/lib/form'

const repeaterDropdown = (
	<DropdownMenu>
		<DropdownMenuTrigger asChild>
			<DropDownTriggerButton />
		</DropdownMenuTrigger>
		<DropdownMenuContent className="w-[160px]">
			<DropdownMenuItem>Edit</DropdownMenuItem>
			<DropdownMenuItem>Make a copy</DropdownMenuItem>
			<DropdownMenuSeparator />
			<DeleteEntityDialog trigger={<DropdownMenuItem onSelect={e => e.preventDefault()}>
				Delete
			</DropdownMenuItem>} />
		</DropdownMenuContent>
	</DropdownMenu>
)

export default () => (
	<Binding>
		<Slots.Title>
			<Title icon={<GripVertical />}>Sortable repeater</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

		<DefaultRepeater entities="RepeaterItem" sortableBy="order" title="Foo items" addButtonPosition="around">
			<InputField field="title" />

			<SelectField field="relation" >
				<Field field="id" /> /
				<Field field="name" />
			</SelectField>

			<RepeaterItemActions>
				{repeaterDropdown}
				<RepeaterRemoveItemButton />
			</RepeaterItemActions>
		</DefaultRepeater>
	</Binding>
)

export const OnRelation = () => (
	<Binding>
		<Slots.Title>
			<Title icon={<GripVertical />}>Repeater on relation</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

		<EntitySubTree entity="RepeaterRoot(unique = unique)" setOnCreate="(unique = unique)">
			<DefaultRepeater field="items" sortableBy="order" title="Foo items" addButtonPosition="around">
				<Field field="id" /><br/>
				<InputField field="title" />
				<SelectField field="relation">
					<Field field="id" /> /
					<Field field="name" />
				</SelectField>

				<RepeaterItemActions>
					{repeaterDropdown}
					<RepeaterRemoveItemButton />
				</RepeaterItemActions>
			</DefaultRepeater>
		</EntitySubTree>
	</Binding>
)

export const NonSortable = () => (
	<Binding>
		<Slots.Title>
			<Title icon={<GripVertical />}>Non-sortable repeater</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>

		<DefaultRepeater entities="RepeaterItem" orderBy="order" title="Foo items">
			<Field field="title" />

			<RepeaterItemActions>
				{repeaterDropdown}
				<RepeaterRemoveItemButton />
			</RepeaterItemActions>
		</DefaultRepeater>
	</Binding>
)
