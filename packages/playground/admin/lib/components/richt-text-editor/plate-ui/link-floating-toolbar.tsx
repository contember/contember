import { cn } from '@udecode/cn'
import { flip, offset, UseVirtualFloatingOptions } from '@udecode/plate-floating'
import {
	FloatingLinkUrlInput,
	LinkFloatingToolbarState,
	LinkOpenButton,
	useFloatingLinkEdit,
	useFloatingLinkEditState,
	useFloatingLinkInsert,
	useFloatingLinkInsertState,
} from '@udecode/plate-link'
import { ExternalLinkIcon, LinkIcon, TextIcon, UnlinkIcon } from 'lucide-react'
import { Button, buttonConfig } from '../../ui/button'
import { Input, inputConfig } from '../../ui/input'
import { popoverVariants } from './popover'

import { Separator } from './separator'
import { uic } from '../../../utils/uic'

const floatingOptions: UseVirtualFloatingOptions = {
	placement: 'bottom-start',
	middleware: [
		offset(12),
		flip({
			padding: 12,
			fallbackPlacements: ['bottom-end', 'top-start', 'top-end'],
		}),
	],
}

export interface LinkFloatingToolbarProps {
	state?: LinkFloatingToolbarState;
}

const FloatingLinkUrlInputUi = uic(FloatingLinkUrlInput, {
	...inputConfig,
})

export function LinkFloatingToolbar({ state }: LinkFloatingToolbarProps) {
	const insertState = useFloatingLinkInsertState({
		...state,
		floatingOptions: {
			...floatingOptions,
			...state?.floatingOptions,
		},
	})
	const {
		props: insertProps,
		ref: insertRef,
		hidden,
		textInputProps,
	} = useFloatingLinkInsert(insertState)

	const editState = useFloatingLinkEditState({
		...state,
		floatingOptions: {
			...floatingOptions,
			...state?.floatingOptions,
		},
	})
	const {
		props: editProps,
		ref: editRef,
		editButtonProps,
		unlinkButtonProps,
	} = useFloatingLinkEdit(editState)

	if (hidden) return null

	const input = (
		<div className="flex w-[330px] flex-col">
			<div className="flex items-center">
				<div className="flex items-center pl-3 text-muted-foreground">
					<LinkIcon className="size-4"/>
				</div>

				<FloatingLinkUrlInputUi
					placeholder="Paste link"
					variant="ghost"
					inputSize="sm"
				/>
			</div>

			<Separator/>

			<div className="flex items-center">
				<div className="flex items-center pl-3 text-muted-foreground">
					<TextIcon className="size-4"/>
				</div>
				<Input
					className={'border-0'}
					placeholder="Text to display"
					{...textInputProps}
				/>
			</div>
		</div>
	)

	const editContent = editState.isEditing ? (
		input
	) : (
		<div className="box-content flex h-9 items-center gap-1">
			<Button
				variant="ghost"
				size="sm"
				{...editButtonProps}
			>
				Edit link
			</Button>

			<Separator orientation="vertical"/>

			<LinkOpenButton
				className={cn(buttonConfig.baseClass, buttonConfig.variants?.variant.ghost, buttonConfig.variants?.size.sm)}
			>
				<ExternalLinkIcon width={18}/>
			</LinkOpenButton>

			<Separator orientation="vertical"/>

			<Button
				variant="ghost"
				size="sm"
				{...unlinkButtonProps}
			>
				<UnlinkIcon width={18}/>
			</Button>
		</div>
	)

	return (
		<>
			<div
				ref={insertRef}
				className={cn(popoverVariants(), 'w-auto p-1')}
				{...insertProps}
			>
				{input}
			</div>

			<div
				ref={editRef}
				className={cn(popoverVariants(), 'w-auto p-1')}
				{...editProps}
			>
				{editContent}
			</div>
		</>
	)
}
