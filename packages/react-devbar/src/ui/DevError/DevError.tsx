import { DevErrorInner, DevErrorInnerProps } from './DevErrorInner'

export interface DevErrorProps extends DevErrorInnerProps {
	source: string
}

const className = (cls?: string | null) => cls ? `cui-devError-${cls}` : 'cui-devError'

export function DevError(props: DevErrorProps) {

	return (
		<div className={className()}>
			<div className={className('in')}>
				<div className={className('bar')}>
					<div className={className('errorSource')}>{props.source}</div>
				</div>
				<DevErrorInner error={props.error} />
			</div>
		</div>
	)
}
