import { ComponentType, useCallback, useState } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader } from '../ui/alert-dialog'
import { useIsApplicationOutdated } from '@contember/interface'
import { ClockIcon, RefreshCwIcon } from 'lucide-react'
import { dict } from '../dict'

const postponeTimeoutMs = 60_000 * 5
const checkIntervalMs = 30_000

export const OutdatedApplicationDialog: ComponentType = () => {
	const isOutdated = useIsApplicationOutdated({ checkIntervalMs })
	const [open, setOpen] = useState(true)

	const postpone = useCallback(() => {
		setOpen(false)
		setTimeout(() => setOpen(true), postponeTimeoutMs)
	}, [])

	return (
		<AlertDialog open={isOutdated && open} onOpenChange={it => !it ? postpone() : null}>
			<AlertDialogContent>
				<AlertDialogHeader>{dict.outdatedApplication.title}</AlertDialogHeader>
				<AlertDialogDescription>{dict.outdatedApplication.description}</AlertDialogDescription>

				<div className="text-sm text-destructive">{dict.outdatedApplication.warning}</div>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={postpone} className="gap-1">
						<ClockIcon className="w-3 h-4"/>
						{dict.outdatedApplication.snooze}
					</AlertDialogCancel>
					<AlertDialogAction onClick={() => window.location.reload()} className="gap-1">
						<RefreshCwIcon className="w-3 h-4" />
						{dict.outdatedApplication.refreshNow}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}


