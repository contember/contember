import * as React from 'react'
import { Binding, DeleteEntityDialog, PersistButton } from '@app/lib/binding'
import { Slots } from '@app/lib/layout'
import { Field } from '@contember/interface'
import { DefaultRepeater, RepeaterItemActions, RepeaterRemoveItemButton } from '@app/lib/repeater'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropDownTriggerButton } from '@app/lib/ui/dropdown'

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
		<DefaultRepeater entities={'RepeaterItem'} sortableBy={'order'} title="Foo items">
			<Field field={'title'} />

			<RepeaterItemActions>
				{repeaterDropdown}
				<RepeaterRemoveItemButton />
			</RepeaterItemActions>
		</DefaultRepeater>
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
