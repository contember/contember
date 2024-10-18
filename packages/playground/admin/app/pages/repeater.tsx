import * as React from 'react'
import { Binding, DeleteEntityDialog, PersistButton } from '@app/lib/binding'
import { Slots } from '@app/lib/layout'
import { EntitySubTree, Field } from '@contember/interface'
import { DefaultRepeater, RepeaterItemActions, RepeaterRemoveItemButton } from '@app/lib/repeater'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropDownTriggerButton } from '@app/lib/ui/dropdown'
import { InputField, SelectField } from '@app/lib/form'

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

export default <>
	<Binding>
		<Slots.Actions><PersistButton /></Slots.Actions>
		<DefaultRepeater entities={'RepeaterItem'} sortableBy={'order'} title="Foo items" addButtonPosition="around">
			<InputField field={'title'} />
			<SelectField field={'relation'} >
				<Field field={'id'} /> /
				<Field field={'name'} />
			</SelectField>

			<RepeaterItemActions>
				{repeaterDropdown}
				<RepeaterRemoveItemButton />
			</RepeaterItemActions>
		</DefaultRepeater>
	</Binding>
</>

export const onRelation = <>
	<Binding>
		<Slots.Actions><PersistButton /></Slots.Actions>
		<EntitySubTree entity="RepeaterRoot(unique=unique)" setOnCreate="(unique=unique)">
			<DefaultRepeater field={'items'} sortableBy={'order'} title="Foo items" addButtonPosition="around">
				<Field field={'id'} /><br/>
				<InputField field={'title'} />
				<SelectField field={'relation'}>
					<Field field={'id'} /> /
					<Field field={'name'} />
				</SelectField>

				<RepeaterItemActions>
					{repeaterDropdown}
					<RepeaterRemoveItemButton />
				</RepeaterItemActions>
			</DefaultRepeater>
		</EntitySubTree>
	</Binding>
</>


export const nonSortable = <>
	<Binding>
		<Slots.Actions><PersistButton /></Slots.Actions>
		<DefaultRepeater entities={'RepeaterItem'} orderBy="order">
			<Field field={'title'} />

			<RepeaterItemActions>
				{repeaterDropdown}
				<RepeaterRemoveItemButton />
			</RepeaterItemActions>
		</DefaultRepeater>
	</Binding>
</>
