import { useClassNameFactory } from '@contember/react-utils'
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
								<div className={componentClassName('switcherButtons')}>
									<button className={componentClassName('switcherButton')} onClick={onPrevious}>
										ᐊ
									</button>
									<button className={componentClassName('switcherButton')} onClick={onNext}>
										ᐅ
									</button>
								</div>
							</div>
						) : null}
						<div className={componentClassName('close')}>
							<button className={componentClassName('closeButton')} onClick={onClose}>
								🗙
							</button>
						</div>
					</div>
				</div>

				<DevErrorInner error={currentError} />
			</div>
		</div>
	)
}
