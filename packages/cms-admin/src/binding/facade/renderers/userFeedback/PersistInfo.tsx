import * as React from 'react'
import { connect } from 'react-redux'
import { addToast, dismissToast } from '../../../../actions/toasts'
import { Dispatch } from '../../../../actions/types'
import State from '../../../../state'
import { ToastDefinition, ToastId, ToastType } from '../../../../state/toasts'
import { DirtinessContextValue, MutationStateContextValue } from '../../../coreComponents/PersistState'

export interface PersistInfoPublicProps {
	timeout?: number
	successMessage?: string
	errorMessage?: string
}

export interface PersistInfoOwnProps extends PersistInfoPublicProps {
	isDirty: DirtinessContextValue
	isMutating: MutationStateContextValue
}

interface PersistInfoDispatchProps {
	showToast: (toast: ToastDefinition) => ToastId | undefined
	dismissToast: (toastId: ToastId) => void
}

export interface PersistInfoProps extends PersistInfoOwnProps, PersistInfoDispatchProps {}

export class PersistInfoConnected extends React.PureComponent<PersistInfoProps> {
	public render(): React.ReactNode {
		return null
	}

	public componentDidUpdate(prevProps: PersistInfoProps) {
		if (prevProps.isMutating && !this.props.isMutating) {
			this.displayFeedback(this.props.isDirty ? ToastType.Error : ToastType.Success)
		}
	}

	private displayFeedback(result: ToastType) {
		const toastId = this.props.showToast({
			type: result,
			message: this.getUserMessage(result),
		})
		const timeout = this.props.timeout !== undefined ? this.props.timeout : 5000

		// Intentionally not ever clearing the timeouts ‒ we always want to dismiss old toasts.
		toastId !== undefined &&
			setTimeout(() => {
				this.props.dismissToast(toastId)
			}, timeout)
	}

	private getUserMessage(result: ToastType): ToastDefinition['message'] {
		switch (result) {
			case ToastType.Success:
				return this.props.successMessage || 'Success!'
			case ToastType.Error:
				return this.props.errorMessage || 'Error!'
			default:
				return '?!?!'
		}
	}
}

// typescript is generating invalid .d.ts file

type PersistInfoType = React.ComponentClass<
	Pick<PersistInfoProps, Exclude<keyof PersistInfoProps, keyof PersistInfoDispatchProps>>,
	any
> & {
	WrappedComponent: React.ComponentType<PersistInfoProps>
}

export const PersistInfo: PersistInfoType = connect<{}, PersistInfoDispatchProps, {}, State>(
	undefined,
	(dispatch: Dispatch) => ({
		showToast: (toast: ToastDefinition) => {
			const toastAction = addToast(toast)
			dispatch(toastAction)
			return toastAction.payload ? toastAction.payload.id : undefined
		},
		dismissToast: (toastId: ToastId) => {
			dispatch(dismissToast(toastId))
		},
	}),
)(PersistInfoConnected)
