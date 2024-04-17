import { DropdownMenuProps } from '@radix-ui/react-dropdown-menu'
import {
	collapseSelection,
	findNode,
	focusEditor,
	isBlock,
	isCollapsed,
	TElement,
	toggleNodeType,
	useEditorRef,
	useEditorSelector,
} from '@udecode/plate-common'
import { ELEMENT_H1, ELEMENT_H2, ELEMENT_H3 } from '@udecode/plate-heading'
import { ELEMENT_PARAGRAPH } from '@udecode/plate-paragraph'
import { Heading1Icon, Heading2Icon, Heading3Icon, PilcrowIcon } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from '../../ui/dropdown'
import { useOpenState } from '../lib/helpers'
import { ToolbarButton } from './toolbar'

const items = [
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
]

const defaultItem = items.find(item => item.value === ELEMENT_PARAGRAPH)!

export function TurnIntoDropdownMenu(props: DropdownMenuProps) {
	const value: string = useEditorSelector(editor => {
		if (isCollapsed(editor.selection)) {
			const entry = findNode<TElement>(editor, {
				match: n => isBlock(editor, n),
			})

			if (entry) {
				return (
					items.find(item => item.value === entry[0].type)?.value ??
					ELEMENT_PARAGRAPH
				)
			}
		}

		return ELEMENT_PARAGRAPH
	}, [])

	const editor = useEditorRef()
	const openState = useOpenState()

	const selectedItem =
		items.find(item => item.value === value) ?? defaultItem
	const { icon: SelectedItemIcon, label: selectedItemLabel } = selectedItem

	return (
		<DropdownMenu modal={false} {...openState} {...props}>
			<DropdownMenuTrigger asChild>
				<ToolbarButton
					pressed={openState.open}
					tooltip="Turn into"
					isDropdown
					className="lg:min-w-[130px]"
				>
					<SelectedItemIcon className="size-5 lg:hidden"/>
					<span className="max-lg:hidden">{selectedItemLabel}</span>
				</ToolbarButton>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="start" className="min-w-0">
				<DropdownMenuLabel>Turn into</DropdownMenuLabel>

				<DropdownMenuRadioGroup
					className="flex flex-col gap-0.5"
					value={value}
					onValueChange={type => {
						toggleNodeType(editor, { activeType: type })

						collapseSelection(editor)
						focusEditor(editor)
					}}
				>
					{items.map(({ value: itemValue, label, icon: Icon }) => (
						<DropdownMenuRadioItem
							key={itemValue}
							value={itemValue}
							className="min-w-[180px]"
						>
							<Icon className="mr-2 size-5"/>
							{label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
