import { Slot } from '@radix-ui/react-slot'
import { ComponentType, MouseEventHandler, ReactElement, useMemo, useState } from 'react'
import { composeEventHandlers } from '@radix-ui/primitive'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { toFormErrorCode } from '../../types/forbidden.js'
import { FormErrorCode } from '../../types/forms.js'

const SlotButton = Slot as ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>

/** What an action's `onError` receives. `code` is `FORBIDDEN` when the API refused, not when it failed. */
export type TenantActionErrorArgs<Error extends string = never> = { code: Error | FormErrorCode; error: unknown }

export interface TenantActionTriggerProps<OkResult, Error extends string> {
	children: ReactElement
	onClick?: MouseEventHandler<HTMLButtonElement>
	onSuccess?: (args: { result: OkResult }) => void
	onError?: (args: TenantActionErrorArgs<Error>) => void
	execute: () => Promise<({ ok: true } & (OkResult extends undefined ? {} : { result: OkResult })) | { ok: false; error?: Error }>
}

export const TenantActionTrigger = <OkResult, Error extends string>(
	{ onError: onErrorIn, onSuccess: onSuccessIn, onClick: onClickProp, execute: executeIn, ...props }: TenantActionTriggerProps<OkResult, Error>,
) => {
	const [submitting, setSubmitting] = useState(false)

	const onSuccess = useReferentiallyStableCallback(onSuccessIn || (() => undefined))
	const onError = useReferentiallyStableCallback(onErrorIn || (() => undefined))
	const execute = useReferentiallyStableCallback(executeIn)

	const onClick = useMemo(() => async () => {
		setSubmitting(true)
		try {
			const response = await execute()
			setSubmitting(false)
			if (response.ok) {
				onSuccess?.({ result: 'result' in response ? response.result : undefined as OkResult })
			} else {
				onError?.({ code: response.error ?? 'UNKNOWN_ERROR', error: response })
			}
		} catch (e) {
			const code = toFormErrorCode(e)
			if (code !== 'FORBIDDEN') {
				console.error(e)
			}
			setSubmitting(false)
			onError?.({ code, error: e })
		}
	}, [execute, onError, onSuccess])

	return <SlotButton onClick={composeEventHandlers(onClickProp, onClick)} disabled={submitting} {...props} />
}
