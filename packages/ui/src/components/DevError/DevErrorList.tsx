import { useClassNameFactory } from '@contember/utilities'
import { Button, ButtonGroup } from '../Forms'
import { Icon } from '../Icon'
import { DevErrorInner } from './DevErrorInner'
import { ProcessedError } from './types'

export interface DevErrorListProps {
	currentError: ProcessedError
	currentErrorSource: string
	currentErrorIndex: number
	errorCount: number
	onPrevious: () => void
	onNext: () => void
	onClose: () => void
}


export function DevErrorList({
	currentError,
	currentErrorIndex,
	currentErrorSource,
	errorCount,
	onClose,
	onNext,
	onPrevious,
}: DevErrorListProps) {
	const componentClassName = useClassNameFactory('devError')

	return (
		<div className={componentClassName()}>
			<div className={componentClassName('in')}>
				<div className={componentClassName('bar')}>
					<div className={componentClassName('errorSource')}>{currentErrorSource}</div>
					<div className={componentClassName('actions')}>
						{errorCount > 1 ? (
							<div className={componentClassName('switcher')}>
								<p className={componentClassName('errorCount')}>
									Error {currentErrorIndex + 1} of {errorCount}
								</p>
								<ButtonGroup size="small">
									<Button distinction="outlined" size="small" onClick={onPrevious}>
										<Icon blueprintIcon="arrow-left" />{' '}
									</Button>
									<Button distinction="outlined" size="small" onClick={onNext}>
										<Icon blueprintIcon="arrow-right" />{' '}
									</Button>
								</ButtonGroup>
							</div>
						) : null}
						<div className={componentClassName('close')}>
							<Button distinction="outlined" size="small" onClick={onClose}>
								<Icon blueprintIcon="cross" />{' '}
							</Button>
						</div>
					</div>
				</div>

				<DevErrorInner error={currentError} />
			</div>
		</div>
	)
}
