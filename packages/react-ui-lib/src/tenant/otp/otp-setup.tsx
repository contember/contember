import { useMemo, useState } from 'react'
import qrcode from 'qrcode-generator'
import { DisableOtpTrigger, OtpConfirmForm, OtpPrepareForm, useIdentity, useOtpConfirmForm, useOtpPrepareForm } from '@contember/interface'
import { Loader } from '../../ui/loader'
import { Button } from '../../ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../ui/alert-dialog'
import { TenantFormError, TenantFormField } from '../forms/common'
import { ToastContent, useShowToast } from '../../toast'
import { dict } from '../../dict'

export const OtpSetup = () => {
	const identity = useIdentity()
	const showToast = useShowToast()
	const [initializingOtp, setInitializingOtp] = useState(false)
	const [otpUri, setOtpUri] = useState<string>()

	const person = identity?.person

	if (!person) {
		return null
	}

	if (initializingOtp) {
		return (
			<OtpPrepareForm
				onSuccess={({ result: { otpUri } }) => {
					setInitializingOtp(false)
					setOtpUri(otpUri)
				}}
			>
				<form>
					{person.otpEnabled && <>
						<div className="border-destructive border p-4 mb-4 rounded">
							{dict.tenant.otpSetup.alreadyHaveOtp}
						</div>
					</>}
					<OtpPrepareFormFields />
				</form>
			</OtpPrepareForm>
		)
	}
	if (otpUri) {
		return <>
			<p>
				{dict.tenant.otpSetup.nowScanQrCode}
			</p>
			<QrCode data={otpUri} />
			<p>
				{dict.tenant.otpSetup.writeDownCode}
			</p>
			<OtpConfirmForm onSuccess={() => {
				showToast(<ToastContent>{dict.tenant.otpSetup.enabledSuccess}</ToastContent>, { type: 'success' })
			}}>
				<form>
					<OtpConfirmFormFields />
				</form>
			</OtpConfirmForm>
		</>
	}

	if (person.otpEnabled) {
		return <>
			<p>
				{dict.tenant.otpSetup.twoFactorEnabled}
			</p>
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="destructive">{dict.tenant.otpSetup.disableTwoFactor}</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{dict.tenant.otpSetup.disableTwoFactor}</AlertDialogTitle>
						<AlertDialogDescription>{dict.tenant.otpSetup.disableTwoFactorConfirm}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{dict.tenant.otpSetup.cancel}
						</AlertDialogCancel>
						<DisableOtpTrigger onSuccess={() => {
							showToast(<ToastContent>{dict.tenant.otpSetup.disabledSuccess}</ToastContent>, { type: 'success' })
						}}>
							<AlertDialogAction variant="destructive">
								{dict.tenant.otpSetup.disable}
							</AlertDialogAction>
						</DisableOtpTrigger>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<p>{dict.tenant.otpSetup.alreadyHaveOtp}</p>
			<Button onClick={() => setInitializingOtp(true)}>{dict.tenant.otpSetup.setupAgain}</Button>
		</>
	}
	return <>
		<p>
			{dict.tenant.otpSetup.description}
		</p>
		<Button onClick={() => setInitializingOtp(true)}>{dict.tenant.otpSetup.setupTwoFactor}</Button>
	</>
}

const QrCode = ({ data }: { data: string }) => {
	const code = useMemo(() => {
		const qr = qrcode(0, 'L')
		qr.addData(data)
		qr.make()
		return qr.createDataURL(4)
	}, [data])
	return <img src={code} />
}

export const OtpConfirmFormFields = () => {
	const form = useOtpConfirmForm()
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'success' || form.state === 'submitting' ? <Loader position="absolute" /> : null}
			<TenantFormError form={form} messages={dict.tenant.otpSetup.otpConfirmFormErrorMessages} />
			<TenantFormField
				form={form} messages={dict.tenant.otpSetup.otpConfirmFormErrorMessages} field="otpToken"
				type="text" required
			>
				{dict.tenant.otpSetup.otpToken}
			</TenantFormField>
			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.otpSetup.confirm}
			</Button>
		</div>
	)
}
export const OtpPrepareFormFields = () => {
	const form = useOtpPrepareForm()
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'success' || form.state === 'submitting' ? <Loader position="absolute" /> : null}
			<TenantFormError form={form} messages={dict.tenant.otpSetup.otpPrepareFormErrorMessages} />
			<TenantFormField
				form={form} messages={dict.tenant.otpSetup.otpPrepareFormErrorMessages} field="label"
				type="text"
			>
				{dict.tenant.otpSetup.label}
			</TenantFormField>
			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.otpSetup.prepareContinue}
			</Button>
		</div>
	)
}
