import { Component, DeleteEntityTrigger, PersistTrigger, StaticRender, SuccessfulPersistResult, useEntity } from '@contember/interface'
import {
	BlockRepeater,
	BlockRepeaterAddItemTrigger,
	BlockRepeaterProps,
	useBlockRepeaterConfig,
	useBlockRepeaterCurrentBlock,
} from '@contember/react-block-repeater'
import { RepeaterAddItemIndex, RepeaterEmpty } from '@contember/react-repeater'
import {
	RepeaterSortable,
	RepeaterSortableDragOverlay,
	RepeaterSortableEachItem,
	RepeaterSortableItemActivator,
	RepeaterSortableItemNode,
} from '@contember/react-repeater-dnd-kit'
import { createRequiredContext } from '@contember/react-utils'
import { GripVerticalIcon, PlusCircleIcon, TrashIcon } from 'lucide-react'
import { useCallback, useId, useState } from 'react'
import { usePersistSuccessHandler } from '../binding'
import { dict } from '../dict'
import { RepeaterDropIndicator, RepeaterRemoveItemButton } from '../repeater'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown'
import { Label } from '../ui/label'
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '../ui/sheet'
import { Switch } from '../ui/switch'
import { uic } from '../utils'

const BlockRepeaterItemsWrapperUI = uic('div', {
	baseClass: 'rounded border border-gray-300 px-4 py-8 flex flex-col',
})
const BlockRepeaterItemUI = uic('div', {
	baseClass: 'relative border-t transition-all group',
})
const BlockRepeaterDragOverlayUI = uic('div', {
	baseClass: 'rounded border border-gray-300 p-4 relative bg-opacity-60 bg-gray-100 backdrop-blur-sm',
})
const BlockRepeaterHandleUI = uic('button', {
	baseClass: 'absolute top-1/2 -left-6 h-6 w-6 flex justify-end align-center opacity-10 hover:opacity-100 transition-opacity -translate-y-1/2',
	beforeChildren: <GripVerticalIcon size={16} />,
})

const BlockRepeaterItemActions = uic('div', {
	baseClass: 'absolute top-1 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity',
})

const BlockRepeaterContentWrapperUI = uic('div', {
	baseClass: 'flex flex-col gap-2',
})

export type DefaultBlockRepeaterProps =
	& BlockRepeaterProps

const [BlockRepeaterEditModeContext, useBlockRepeaterEditMode] = createRequiredContext<boolean>('BlockRepeaterEditMode')

/**
 *  The `DefaultBlockRepeater` component is a versatile and customizable block repeater shipped with a UI.
 *  It allows for the creation and management of repeatable content blocks within a form.
 * Supports two modes of operation:
 *   - **Inline Edit Mode**: By providing only `children`, the blocks can be edited inline.
 *   - **Dual-Mode**: By providing both `form` and `children`, the component supports a dual-mode where blocks can be edited in a separate form view.
 *
 * ## Props {@link DefaultBlockRepeaterProps}
 * - field or entities, sortableBy, discriminationField, children
 *
 * ## Example
 * ```tsx
 * <DefaultBlockRepeater field="blocks" sortableBy="order" discriminationField="type">
 *   <Block
 *     name="text"
 *     label={<><TextIcon /> Text</>}
 *     form={<>
 *       <InputField field="title" label="Title" />
 *       <TextareaField field="content" label="Content" />
 *     </>}
 *     children={<>
 *       <div className="flex">
 *         <div className="w-64 space-y-2">
 *           <h2 className="text-xl font-bold">
 *             <Field field="title" />
 *           </h2>
 *           <p>
 *             <Field field="content" />
 *           </p>
 *         </div>
 *       </div>
 *     </>
 *     }
 *   />
 * </DefaultBlockRepeater>
 * ```
 */
export const DefaultBlockRepeater = Component<DefaultBlockRepeaterProps>(({ children, ...props }) => {
	const [editMode, setEditMode] = useState(false)
	return (
		<BlockRepeater {...props}>
			<StaticRender>
				{children}
			</StaticRender>
			<BlockRepeaterEditModeContext.Provider value={editMode}>
				<BlockRepeaterContentWrapperUI>
					<ToggleEditMode setEditMode={setEditMode} editMode={editMode} />
					<BlockRepeaterSortable sortableBy={props.sortableBy} />
					<div className="mt-4">
						<BlockRepeaterAddButtons />
					</div>
				</BlockRepeaterContentWrapperUI>
			</BlockRepeaterEditModeContext.Provider>
		</BlockRepeater>
	)
}, props => {
	return <BlockRepeater {...props} />
})

const ToggleEditMode = ({ setEditMode, editMode }: { setEditMode: (value: boolean) => void; editMode: boolean }) => {
	const id = useId()
	const { blocks } = useBlockRepeaterConfig()
	const anyHasForm = Object.values(blocks).some(it => it.form)
	if (!anyHasForm) {
		return null
	}
	return (
		<div className="flex items-center space-x-2 justify-end mb-2">
			<Switch id={id} checked={editMode} onCheckedChange={setEditMode} />
			<Label htmlFor={id}>Edit mode</Label>
		</div>
	)
}

const BlockRepeaterSortable = Component<{
	sortableBy: DefaultBlockRepeaterProps['sortableBy']
}>(({ sortableBy }) => {
	return (
		<RepeaterSortable>
			<BlockRepeaterItemsWrapperUI>
				<RepeaterEmpty>
					<div className="italic text-sm text-gray-600">
						{dict.repeater.empty}
					</div>
				</RepeaterEmpty>
				<RepeaterSortableEachItem>
					<div className="relative">
						<RepeaterDropIndicator position={'before'} />
						<RepeaterSortableItemNode>
							<BlockRepeaterItemUI>
								<RepeaterSortableItemActivator>
									<BlockRepeaterHandleUI />
								</RepeaterSortableItemActivator>
								<BlockRepeaterContent />
							</BlockRepeaterItemUI>
						</RepeaterSortableItemNode>
						<RepeaterDropIndicator position={'after'} />
						<BlockRepeaterAddItemBefore sortableBy={sortableBy} />
					</div>
				</RepeaterSortableEachItem>

				<RepeaterSortableDragOverlay>
					<BlockRepeaterDragOverlayUI>
						<BlockRepeaterContent />
					</BlockRepeaterDragOverlayUI>
				</RepeaterSortableDragOverlay>

			</BlockRepeaterItemsWrapperUI>
		</RepeaterSortable>
	)
})

const BlockRepeaterAddButtons = ({ index }: { index?: RepeaterAddItemIndex }) => {
	const { blocks } = useBlockRepeaterConfig()
	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2">
			{Object.values(blocks).map(it => (
				<BlockRepeaterAddItemTrigger key={it.name} type={it.name} index={index}>
					<Button
						size="lg"
						variant="outline"
						className="aspect-square flex-col h-auto gap-2 p-2"
						onClick={e => e.stopPropagation()}
					>
						{it.label || it.name}
					</Button>
				</BlockRepeaterAddItemTrigger>
			))}
		</div>
	)
}


const BlockRepeaterContent = () => {
	const entity = useEntity()
	const block = useBlockRepeaterCurrentBlock()
	const children = block?.children
	const editMode = useBlockRepeaterEditMode()
	const editForm = block?.form ?? block?.children
	const [editEntity, setEditEntity] = useState(!entity.existsOnServer)

	if (!block?.form || editMode) {
		return (
			<div className="p-4">
				<BlockRepeaterItemActions>
					<RepeaterRemoveItemButton />
				</BlockRepeaterItemActions>
				{editForm}
			</div>
		)
	}
	return <>
		<div className="p-4 cursor-pointer hover:bg-gray-50 " onClick={() => setEditEntity(true)}>
			{children}
		</div>
		<BlockRepeaterEditSheetInner open={editEntity} setOpen={setEditEntity} />
	</>
}


const BlockRepeaterAddItemBefore = ({ sortableBy }: { sortableBy: DefaultBlockRepeaterProps['sortableBy'] }) => {
	const entity = useEntity()
	const order = sortableBy ? entity.getField<number>(sortableBy).value : null
	const { blocks } = useBlockRepeaterConfig()
	if (order === null) {
		return null
	}
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button className="absolute top-0 right-1/2 -translate-x-1/2 -translate-y-1/2 bg-white" variant="ghost">
					<PlusCircleIcon className="w-4 h-4  opacity-25 hover:opacity-100 transition-opacity" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{Object.values(blocks).map(it => (
					<BlockRepeaterAddItemTrigger key={it.name} type={it.name} index={order}>
						<DropdownMenuItem className="gap-2">
							{it.label || it.name}
						</DropdownMenuItem>
					</BlockRepeaterAddItemTrigger>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

const BlockRepeaterEditSheetInner = ({ open, setOpen }: { open: boolean; setOpen: (value: boolean) => void }) => {
	const block = useBlockRepeaterCurrentBlock()
	const form = block?.form
	const editMode = useBlockRepeaterEditMode()
	const persistSuccess = usePersistSuccessHandler()
	const onSuccess = useCallback((result: SuccessfulPersistResult) => {
		persistSuccess(result)
		setOpen(false)
	}, [persistSuccess, setOpen])

	if (!form || editMode) {
		return null
	}
	return (
		<Sheet open={open} onOpenChange={setOpen} modal={false}>
			<SheetContent
				onFocusOutside={e => {
					e.preventDefault()
				}}
			>
				<SheetHeader>
					<SheetTitle className="flex gap-2">
						{block.label}
						<DeleteEntityTrigger>
							<SheetClose asChild>
								<Button
									variant="destructive"
									className="ml-auto"
									size="sm"
								>
									<TrashIcon className="w-3 h-3" />
								</Button>
							</SheetClose>
						</DeleteEntityTrigger>
					</SheetTitle>
				</SheetHeader>
				<div className="my-4">
					{form}
				</div>
				<SheetFooter>
					<SheetClose asChild>
						<Button variant="link">Close</Button>
					</SheetClose>
					<PersistTrigger onPersistSuccess={onSuccess}>
						<Button variant="link">Close & save</Button>
					</PersistTrigger>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
