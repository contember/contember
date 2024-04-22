import * as React from 'react'
import { Binding, DeleteEntityDialog, PersistButton } from '../../lib/components/binding'
import { Slots } from '../../lib/components/slots'
import { Field } from '@contember/interface'
import { DefaultRepeater, RepeaterItemActions, RepeaterRemoveItemButton } from '../../lib/components/repeater'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropDownTriggerButton } from '../../lib/components/ui/dropdown'

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
