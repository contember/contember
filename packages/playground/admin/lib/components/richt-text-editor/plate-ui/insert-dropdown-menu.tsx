import { DropdownMenuProps } from '@radix-ui/react-dropdown-menu'
import { focusEditor, insertEmptyElement, useEditorRef } from '@udecode/plate-common'
import { ELEMENT_H1, ELEMENT_H2, ELEMENT_H3 } from '@udecode/plate-heading'
import { ELEMENT_PARAGRAPH } from '@udecode/plate-paragraph'
import { Heading1Icon, Heading2Icon, Heading3Icon, PilcrowIcon, PlusIcon } from 'lucide-react'
import { Fragment } from 'react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../../ui/dropdown'
import { useOpenState } from '../lib/helpers'
import { ToolbarButton } from './toolbar'

const items = [
	{
		label: 'Basic blocks',
		items: [
			{
				value: ELEMENT_PARAGRAPH,
				label: 'Paragraph',
				description: 'Paragraph',
				icon: PilcrowIcon,
			},
			{
				value: ELEMENT_H1,
				label: 'Heading 1',
				description: 'Heading 1',
				icon: Heading1Icon,
			},
			{
				value: ELEMENT_H2,
				label: 'Heading 2',
				description: 'Heading 2',
				icon: Heading2Icon,
			},
			{
				value: ELEMENT_H3,
				label: 'Heading 3',
				description: 'Heading 3',
				icon: Heading3Icon,
			},
		],
	},
]

export function InsertDropdownMenu(props: DropdownMenuProps) {
	const editor = useEditorRef()
	const openState = useOpenState()

	return (
		<DropdownMenu modal={false} {...openState} {...props}>
			<DropdownMenuTrigger asChild>
				<ToolbarButton pressed={openState.open} tooltip="Insert" isDropdown>
					<PlusIcon/>
				</ToolbarButton>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="start"
				className="flex max-h-[500px] min-w-0 flex-col gap-0.5 overflow-y-auto"
			>
				{items.map(({ items: nestedItems, label }, index) => (
					<Fragment key={label}>
						{index !== 0 && <DropdownMenuSeparator/>}

						<DropdownMenuLabel>{label}</DropdownMenuLabel>
						{nestedItems.map(
							({ value: type, label: itemLabel, icon: Icon }) => (
								<DropdownMenuItem
									key={type}
									className="min-w-[180px]"
									onSelect={async () => {
										switch (type) {
											default: {
												insertEmptyElement(editor, type, {
													select: true,
													nextBlock: true,
												})
											}
										}

										focusEditor(editor)
									}}
								>
									<Icon className="mr-2 size-5"/>
									{itemLabel}
								</DropdownMenuItem>
							),
						)}
					</Fragment>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
