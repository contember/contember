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

const className = (cls?: string | null) => cls ? `cui-devError-${cls}` : 'cui-devError'

export function DevErrorList({
	currentError,
	currentErrorIndex,
	currentErrorSource,
	errorCount,
	onClose,
	onNext,
	onPrevious,
}: DevErrorListProps) {
	return (
		<div className={className()}>
			<div className={className('in')}>
				<div className={className('bar')}>
					<div className={className('errorSource')}>{currentErrorSource}</div>
					<div className={className('actions')}>
						{errorCount > 1 ? (
							<div className={className('switcher')}>
								<p className={className('errorCount')}>
									Error {currentErrorIndex + 1} of {errorCount}
								</p>
								<div className={className('switcherButtons')}>
									<button className={className('switcherButton')} onClick={onPrevious}>
										ᐊ
									</button>
									<button className={className('switcherButton')} onClick={onNext}>
										ᐅ
									</button>
								</div>
							</div>
						) : null}
						<div className={className('close')}>
							<button className={className('closeButton')} onClick={onClose}>
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
