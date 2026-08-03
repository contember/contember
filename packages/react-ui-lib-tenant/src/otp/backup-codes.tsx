import { useState } from 'react'
import { RegenerateBackupCodesTrigger, useIdentity } from '@contember/interface'
import { Button } from '@contember/react-ui-lib-base'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	ToastContent,
	useShowToast,
} from '@contember/react-ui-lib-base'
import { dict } from '../dict.js'

export interface BackupCodesDisplayProps {
	codes: readonly string[]
}

export const BackupCodesDisplay = ({ codes }: BackupCodesDisplayProps) => (
	<div className="flex flex-col gap-2">
		<div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-sm border bg-background-upper p-4 font-mono text-sm">
			{codes.map(code => <div key={code}>{code}</div>)}
		</div>
		<p className="text-sm text-gray-500">{dict.tenant.backupCodes.writeDownNote}</p>
	</div>
)

export const BackupCodes = () => {
	const identity = useIdentity()
	const showToast = useShowToast()
	const [codes, setCodes] = useState<readonly string[]>()

	const person = identity?.person
	if (!person) {
		return null
	}

	if (codes) {
		return <BackupCodesDisplay codes={codes} />
	}

	if (!(person.otpEnabled || person.emailOtpEnabled)) {
		return <p>{dict.tenant.backupCodes.noMfaActive}</p>
	}

	return (
		<>
			<p>{dict.tenant.backupCodes.description}</p>
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="destructive">{dict.tenant.backupCodes.regenerate}</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{dict.tenant.backupCodes.regenerate}</AlertDialogTitle>
						<AlertDialogDescription>{dict.tenant.backupCodes.regenerateConfirm}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{dict.tenant.backupCodes.cancel}</AlertDialogCancel>
						<RegenerateBackupCodesTrigger
							onSuccess={({ result: { backupCodes } }) => {
								setCodes(backupCodes)
								showToast(<ToastContent>{dict.tenant.backupCodes.regenerateSuccess}</ToastContent>, { type: 'success' })
							}}
							onError={() => {
								showToast(<ToastContent>{dict.tenant.backupCodes.regenerateFailed}</ToastContent>, { type: 'error' })
							}}
						>
							<AlertDialogAction variant="destructive">{dict.tenant.backupCodes.regenerate}</AlertDialogAction>
						</RegenerateBackupCodesTrigger>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
