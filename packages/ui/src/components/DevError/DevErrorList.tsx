import { useClassNamePrefix } from '../../auxiliary'
import { Button, ButtonGroup } from '../forms'
import { Icon } from '../Icon'
import { DevErrorInner, DevErrorInnerProps } from './DevErrorInner'

export interface DevErrorListProps {
	currentError: DevErrorInnerProps
	currentErrorIndex: number
	errorCount: number
	onPrevious: () => void
	onNext: () => void
	onClose: () => void
}


export function DevErrorList({
	currentError,
	currentErrorIndex,
	errorCount,
	onClose,
	onNext,
	onPrevious,
}: DevErrorListProps) {
	const prefix = useClassNamePrefix()
	return (
		<div className={`${prefix}devError`}>
			<div className={`${prefix}devError-in`}>
				<div className={`${prefix}devError-bar`}>
					<div className={`${prefix}devError-errorSource`}>{currentError.source}</div>
					<div className={`${prefix}devError-actions`}>
						{errorCount > 1 ? (
							<div className={`${prefix}devError-switcher`}>
								<p className={`${prefix}devError-errorCount`}>
									Error {currentErrorIndex + 1} of {errorCount}
								</p>
								<ButtonGroup size={'small'}>
									<Button distinction={'outlined'} size={'small'} onClick={onPrevious}>
										<Icon blueprintIcon={'arrow-left'} />{' '}
									</Button>
									<Button distinction={'outlined'} size={'small'} onClick={onNext}>
										<Icon blueprintIcon={'arrow-right'} />{' '}
									</Button>
								</ButtonGroup>
							</div>
						) : null}
						<div className={`${prefix}devError-close`}>
							<Button distinction={'outlined'} size={'small'} onClick={onClose}>
								<Icon blueprintIcon={'cross'} />{' '}
							</Button>
						</div>
					</div>
				</div>

				<DevErrorInner {...currentError} />
			</div>
		</div>
	)
}
