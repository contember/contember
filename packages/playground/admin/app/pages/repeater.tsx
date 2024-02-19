import * as React from 'react'
import { Binding, DeleteEntityDialog, PersistButton } from '../../lib/components/binding'
import { Slots } from '../../lib/components/slots'
import { Field } from '@contember/interface'
import { DefaultRepeater } from '../../lib/components/repeater'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropDownTriggerButton } from '../../lib/components/ui/dropdown'

export default <>
	<Binding>
		<Slots.Actions><PersistButton /></Slots.Actions>
		<DefaultRepeater entities={'RepeaterItem'} sortableBy={'order'}>
			<Field field={'title'} />

			<div className={'absolute top-0 right-0'}>
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
			</div>
		</DefaultRepeater>
	</Binding>
</>
