import { useClassNameFactory } from '@contember/utilities'
import { DevErrorInner, DevErrorInnerProps } from './DevErrorInner'

export interface DevErrorProps extends DevErrorInnerProps {
	source: string
}

export function DevError(props: DevErrorProps) {
	const componentClassName = useClassNameFactory('devError')

	return (
		<div className={componentClassName()}>
			<div className={componentClassName('in')}>
				<div className={componentClassName('bar')}>
					<div className={componentClassName('errorSource')}>{props.source}</div>
				</div>
				<DevErrorInner error={props.error} />
			</div>
		</div>
	)
}
