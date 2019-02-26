import * as React from 'react'
import { connect } from 'react-redux'
import { addToast } from '../../../../actions/toasts'
import { Dispatch } from '../../../../actions/types'
import State from '../../../../state'
import { DataTreeDirtinessState, DataTreeId, DataTreeMutationState } from '../../../../state/dataTrees'
import { ToastDefinition, ToastType } from '../../../../state/toasts'

export interface PersistInfoPublicProps {
	successMessage?: string
	errorMessage?: string
}

export interface PersistInfoInternalProps {
	treeId: DataTreeId
}

export interface PersistInfoOwnProps extends PersistInfoInternalProps, PersistInfoPublicProps {}

interface PersistInfoStateProps {
	isDirty: DataTreeDirtinessState
	isMutating: DataTreeMutationState
}

interface PersistInfoDispatchProps {
	showToast: (toast: ToastDefinition) => void
}

export interface PersistInfoProps extends PersistInfoOwnProps, PersistInfoStateProps, PersistInfoDispatchProps {}

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
		this.props.showToast({
			type: result,
			message: this.getUserMessage(result)
		})
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

export const PersistInfo = connect<PersistInfoStateProps, PersistInfoDispatchProps, PersistInfoOwnProps, State>(
	({ dataTrees }, ownProps: PersistInfoOwnProps) => {
		const dataTree = dataTrees[ownProps.treeId] || {}
		return {
			isDirty: dataTree.isDirty || false,
			isMutating: dataTree.isMutating || false
		}
	},
	(dispatch: Dispatch) => ({
		showToast: (toast: ToastDefinition) => {
			dispatch(addToast(toast))
		}
	})
)(PersistInfoConnected)
