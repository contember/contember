import * as React from 'react'
import { ReactNode, useState } from 'react'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
	Input,
	Label,
	ToastContent,
	useShowToast,
} from '@contember/react-ui-lib-base'
import { BanIcon, LogOutIcon, ShieldOffIcon, UserCheckIcon } from 'lucide-react'
import { DisablePersonTrigger, EnablePersonTrigger, ForceSignOutPersonTrigger, ResetPersonMfaTrigger } from '@contember/interface'
import { dict } from '../dict.js'
import { actionErrorMessage } from '../errors.js'

export interface PersonActionProps {
	personId: string
	onSuccess: () => void
}

/** Shared shell: an icon button opening a confirm dialog whose action slot hosts the tenant trigger. */
const PersonActionDialog = ({ icon, title, confirmation, confirmLabel, destructive, children, action }: {
	icon: ReactNode
	title: string
	confirmation: string
	confirmLabel: string
	destructive?: boolean
	children?: ReactNode
	action: (props: { children: React.ReactElement }) => ReactNode
}) => {
	const [open, setOpen] = useState(false)
	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button variant={destructive ? 'destructive' : 'outline'} size="sm" title={title}>
					{icon}
					<span className="sr-only">{title}</span>
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{confirmation}</AlertDialogTitle>
				</AlertDialogHeader>
				{children}
				<AlertDialogFooter>
					<AlertDialogCancel>{dict.tenant.personActions.cancel}</AlertDialogCancel>
					<AlertDialogAction asChild>
						{action({
							children: <Button variant={destructive ? 'destructive' : 'default'}>{confirmLabel}</Button>,
						})}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export const DisablePersonAction = ({ personId, onSuccess }: PersonActionProps) => {
	const showToast = useShowToast()
	return (
		<PersonActionDialog
			icon={<BanIcon className="w-3 h-3" />}
			title={dict.tenant.personActions.disableTitle}
			confirmation={dict.tenant.personActions.disableConfirmation}
			confirmLabel={dict.tenant.personActions.disable}
			destructive
			action={({ children }) => (
				<DisablePersonTrigger
					personId={personId}
					onSuccess={() => {
						showToast(<ToastContent>{dict.tenant.personActions.disableSuccess}</ToastContent>, { type: 'success' })
						onSuccess()
					}}
					onError={({ code }) =>
						showToast(<ToastContent>{actionErrorMessage(code, dict.tenant.personActions.disableFailed)}</ToastContent>, { type: 'error' })}
				>
					{children}
				</DisablePersonTrigger>
			)}
		/>
	)
}

export const EnablePersonAction = ({ personId, onSuccess }: PersonActionProps) => {
	const showToast = useShowToast()
	return (
		<PersonActionDialog
			icon={<UserCheckIcon className="w-3 h-3" />}
			title={dict.tenant.personActions.enableTitle}
			confirmation={dict.tenant.personActions.enableConfirmation}
			confirmLabel={dict.tenant.personActions.enable}
			action={({ children }) => (
				<EnablePersonTrigger
					personId={personId}
					onSuccess={() => {
						showToast(<ToastContent>{dict.tenant.personActions.enableSuccess}</ToastContent>, { type: 'success' })
						onSuccess()
					}}
					onError={({ code }) =>
						showToast(<ToastContent>{actionErrorMessage(code, dict.tenant.personActions.enableFailed)}</ToastContent>, { type: 'error' })}
				>
					{children}
				</EnablePersonTrigger>
			)}
		/>
	)
}

export const ForceSignOutPersonAction = ({ personId, onSuccess }: PersonActionProps) => {
	const showToast = useShowToast()
	const [reason, setReason] = useState('')
	return (
		<PersonActionDialog
			icon={<LogOutIcon className="w-3 h-3" />}
			title={dict.tenant.personActions.forceSignOutTitle}
			confirmation={dict.tenant.personActions.forceSignOutConfirmation}
			confirmLabel={dict.tenant.personActions.forceSignOut}
			action={({ children }) => (
				<ForceSignOutPersonTrigger
					personId={personId}
					reason={reason || undefined}
					onSuccess={() => {
						setReason('')
						showToast(<ToastContent>{dict.tenant.personActions.forceSignOutSuccess}</ToastContent>, { type: 'success' })
						onSuccess()
					}}
					onError={({ code }) =>
						showToast(<ToastContent>{actionErrorMessage(code, dict.tenant.personActions.forceSignOutFailed)}</ToastContent>, { type: 'error' })}
				>
					{children}
				</ForceSignOutPersonTrigger>
			)}
		>
			<div className="flex flex-col gap-2">
				<Label htmlFor="force-sign-out-reason">{dict.tenant.personActions.forceSignOutReason}</Label>
				<Input
					id="force-sign-out-reason"
					type="text"
					value={reason}
					placeholder={dict.tenant.personActions.forceSignOutReasonPlaceholder}
					onChange={e => setReason(e.target.value)}
				/>
			</div>
		</PersonActionDialog>
	)
}

export const ResetPersonMfaAction = ({ personId, onSuccess }: PersonActionProps) => {
	const showToast = useShowToast()
	return (
		<PersonActionDialog
			icon={<ShieldOffIcon className="w-3 h-3" />}
			title={dict.tenant.personActions.resetMfaTitle}
			confirmation={dict.tenant.personActions.resetMfaConfirmation}
			confirmLabel={dict.tenant.personActions.resetMfa}
			destructive
			action={({ children }) => (
				<ResetPersonMfaTrigger
					personId={personId}
					onSuccess={() => {
						showToast(<ToastContent>{dict.tenant.personActions.resetMfaSuccess}</ToastContent>, { type: 'success' })
						onSuccess()
					}}
					onError={({ code }) =>
						showToast(<ToastContent>{actionErrorMessage(code, dict.tenant.personActions.resetMfaFailed)}</ToastContent>, { type: 'error' })}
				>
					{children}
				</ResetPersonMfaTrigger>
			)}
		/>
	)
}
