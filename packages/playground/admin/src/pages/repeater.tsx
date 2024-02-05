import * as React from 'react'
import { Binding } from '../components/binding/Binding'
import { Slots } from '../components/slots'
import { PersistButton } from '../components/binding/PersistButton'
import { Field } from '@contember/interface'
import { DefaultRepeater } from '../components/repeater'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropDownTriggerButton,
} from '../components/ui/dropdown'
import { DeleteEntityDialog } from '../components/binding/DeleteEntityDialog'

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
