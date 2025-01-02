import { BrushIcon } from 'lucide-react'
import { Title } from '~/app/components/title'
import { Slots } from '~/lib/layout'
import { Button } from '~/lib/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, useDialogOpenState } from '~/lib/ui/dialog'
import { uic } from '~/lib/utils'

export default () => (
	<>
		<Slots.Title>
			<Title icon={<BrushIcon />}>Dialog</Title>
		</Slots.Title>

		<div>
			<Dialog>
				<CustomDialogState />
				<CustomDialogTrigger />
				<DialogContent>
					<DialogHeader>
						<h1 className="text-3xl">Dialog title</h1>
					</DialogHeader>

					<p className="text-gray-700">
						Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
					</p>

					<DialogFooter>
						<CustomDialogClose />
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	</>
)

const DialogStatusLabel = uic('div', {
	baseClass: 'flex items-center px-3 py-1.5 rounded-full shadow',
	variants: {
		variant: {
			open: 'text-green-700 bg-green-50',
			closed: 'text-gray-700 bg-gray-50',
		},
	},
})

const DialogStatusIndicator = uic('div', {
	baseClass: 'w-2 h-2 rounded-full mr-2',
	variants: {
		variant: {
			open: 'bg-green-500 animate-pulse',
			closed: 'bg-gray-500',
		},
	},
})

const CustomDialogState = () => {
	const [open] = useDialogOpenState()

	return (
		<div className="fixed bottom-2 right-2 z-[60] flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm pointer-events-none">
			{open ? (
				<DialogStatusLabel variant="open">
					<DialogStatusIndicator variant="open" />
					Dialog is opened
				</DialogStatusLabel>
			) : (
				<DialogStatusLabel variant="closed">
					<DialogStatusIndicator variant="closed" />
					Dialog is closed
				</DialogStatusLabel>
			)}
		</div>
	)
}

const CustomDialogTrigger = () => {
	const [, setOpen] = useDialogOpenState()

	return <Button onClick={() => setOpen(true)}>Open dialog</Button>
}

const CustomDialogClose = () => {
	const [, setOpen] = useDialogOpenState()

	return <Button onClick={() => setOpen(false)}>Close dialog</Button>
}
