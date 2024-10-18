import { Dialog, DialogContent, useDialogOpenState } from '@app/lib/ui/dialog'
import { Button } from '@app/lib/ui/button'

export default () => {
	return <>
		<Dialog>
			<CustomDialogState />
			<CustomDialogTrigger />
			<DialogContent>
				Hello world
				<CustomDialogClose />
			</DialogContent>

		</Dialog>
	</>
}

const CustomDialogState = () => {
	const [open] = useDialogOpenState()
	return <div>{open ? 'open' : 'closed'}</div>
}

const CustomDialogTrigger = () => {
	const [, setOpen] = useDialogOpenState()
	return <Button onClick={() => setOpen(true)}>Open</Button>
}

const CustomDialogClose = () => {
	const [, setOpen] = useDialogOpenState()
	return <Button onClick={() => setOpen(false)}>Close</Button>
}
