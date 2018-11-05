import { Alert, IAlertProps } from '@blueprintjs/core'
import * as React from 'react'
import { InnerProps } from '../Link'
import LinkComponent from '../Link/LinkComponent'

export interface AlertLinkProps
	extends Pick<LinkComponent.OwnProps, Exclude<keyof LinkComponent.OwnProps, 'requestChange'>> {
	alert: React.ReactNode
	cancelButtonText: Exclude<IAlertProps['cancelButtonText'], undefined>
	confirmButtonText?: IAlertProps['confirmButtonText']
	intent?: IAlertProps['intent']
	children?: React.ReactNode
}

interface AlertLinkState {
	isOpen: boolean
}

export default (props: AlertLinkProps): React.ComponentType<InnerProps> => {
	return class AlertLink extends React.Component<InnerProps, AlertLinkState> {
		public state: Readonly<AlertLinkState> = {
			isOpen: false
		}

		private onClick: React.MouseEventHandler = e => {
			e.preventDefault()
			if (this.state.isOpen) {
				return
			}
			this.setState({
				isOpen: true
			})
		}

		private onConfirm = (e: React.SyntheticEvent<HTMLElement>) => {
			this.props.onClick(e)
			this.closeAlert()
		}

		private onCancel = () => {
			this.closeAlert()
		}

		private closeAlert() {
			this.setState({
				isOpen: false
			})
		}

		public render() {
			return (
				<a href={this.props.href} onClick={this.onClick}>
					<Alert
						isOpen={this.state.isOpen}
						canEscapeKeyCancel={true}
						canOutsideClickCancel={true}
						cancelButtonText={props.cancelButtonText}
						confirmButtonText={props.confirmButtonText}
						onConfirm={this.onConfirm}
						onCancel={this.onCancel}
						intent={props.intent || 'danger'}
					>
						{props.alert}
					</Alert>
					{props.children}
				</a>
			)
		}
	}
}
