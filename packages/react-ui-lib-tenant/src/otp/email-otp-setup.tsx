import { useState } from 'react'
import { DisableEmailOtpTrigger, EmailOtpConfirmForm, InitEmailOtpTrigger, useEmailOtpConfirmForm, useIdentity } from '@contember/interface'
import { Loader } from '@contember/react-ui-lib-base'
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
} from '@contember/react-ui-lib-base'
import { TenantFormError, TenantFormField } from '../forms/common.js'
import { ToastContent, useShowToast } from '@contember/react-ui-lib-base'
import { BackupCodesDisplay } from './backup-codes.js'
import { dict } from '../dict.js'

export const EmailOtpSetup = () => {
	const identity = useIdentity()
	const showToast = useShowToast()
	const [confirming, setConfirming] = useState(false)
	const [backupCodes, setBackupCodes] = useState<readonly string[]>()

	const person = identity?.person

	if (!person) {
		return null
	}

	const onInitSuccess = () => {
		setConfirming(true)
		showToast(<ToastContent>{dict.tenant.emailOtpSetup.codeSent}</ToastContent>, { type: 'success' })
	}
	const onInitError = () => {
		showToast(<ToastContent>{dict.tenant.emailOtpSetup.initFailed}</ToastContent>, { type: 'error' })
	}

	if (confirming) {
		return (
			<EmailOtpConfirmForm
				onSuccess={({ result: { backupCodes } }) => {
					setConfirming(false)
					setBackupCodes(backupCodes)
					showToast(<ToastContent>{dict.tenant.emailOtpSetup.enabledSuccess}</ToastContent>, { type: 'success' })
				}}
			>
				<form>
					<EmailOtpConfirmFormFields />
				</form>
			</EmailOtpConfirmForm>
		)
	}

	if (backupCodes) {
		return <BackupCodesDisplay codes={backupCodes} />
	}

	if (person.emailOtpEnabled) {
		return (
			<>
				<p>{dict.tenant.emailOtpSetup.emailOtpEnabled}</p>
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant="destructive">{dict.tenant.emailOtpSetup.disableEmailOtp}</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{dict.tenant.emailOtpSetup.disableEmailOtp}</AlertDialogTitle>
							<AlertDialogDescription>{dict.tenant.emailOtpSetup.disableEmailOtpConfirm}</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>
								{dict.tenant.emailOtpSetup.cancel}
							</AlertDialogCancel>
							<DisableEmailOtpTrigger
								onSuccess={() => {
									showToast(<ToastContent>{dict.tenant.emailOtpSetup.disabledSuccess}</ToastContent>, { type: 'success' })
								}}
								onError={() => {
									showToast(<ToastContent>{dict.tenant.emailOtpSetup.disableFailed}</ToastContent>, { type: 'error' })
								}}
							>
								<AlertDialogAction variant="destructive">
									{dict.tenant.emailOtpSetup.disable}
								</AlertDialogAction>
							</DisableEmailOtpTrigger>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
				<InitEmailOtpTrigger onSuccess={onInitSuccess} onError={onInitError}>
					<Button>{dict.tenant.emailOtpSetup.setupAgain}</Button>
				</InitEmailOtpTrigger>
			</>
		)
	}
	return (
		<>
			<p>
				{dict.tenant.emailOtpSetup.description}
			</p>
			<InitEmailOtpTrigger onSuccess={onInitSuccess} onError={onInitError}>
				<Button>{dict.tenant.emailOtpSetup.sendCode}</Button>
			</InitEmailOtpTrigger>
		</>
	)
}

export const EmailOtpConfirmFormFields = () => {
	const form = useEmailOtpConfirmForm()
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'success' || form.state === 'submitting' ? <Loader position="absolute" /> : null}
			<TenantFormError form={form} messages={dict.tenant.emailOtpSetup.emailOtpConfirmFormErrorMessages} />
			<TenantFormField
				form={form}
				messages={dict.tenant.emailOtpSetup.emailOtpConfirmFormErrorMessages}
				field="otpToken"
				type="text"
				required
				maxLength={6}
				autoComplete="one-time-code"
			>
				{dict.tenant.emailOtpSetup.otpToken}
			</TenantFormField>
			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.emailOtpSetup.confirm}
			</Button>
		</div>
	)
}
