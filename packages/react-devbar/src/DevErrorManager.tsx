import { DevErrorBadge, DevErrorList, ErrorType } from './ui/DevError'
import { useEffect, useState } from 'react'
import { useProcessedError } from './hooks/useParsedStacktrace'

export class ErrorBus {
	private queue: { error: ErrorType; source: string }[] = []
	private listener: null | ((error: { error: ErrorType; source: string }) => void) = null

	async handleError(source: string, error: ErrorType) {
		const boxedError = { error, source }

		if (!this.listener) {
			this.queue.push(boxedError)
		} else {
			this.listener(boxedError)
		}
	}

	register(listener: (error: { error: ErrorType; source: string }) => void): () => void {
		this.listener = listener
		this.queue.forEach(listener)
		this.queue = []
		return () => {
			this.listener = null
		}
	}
}

export interface DevErrorManagerProps {
	bus: ErrorBus
}

const compareErrors = (a: ErrorType, b: ErrorType) => {
	if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
		return false
	}
	if (!('stack' in a) || !('stack' in b) || !('message' in a) || !('message' in b)) {
		return false
	}
	if (a.message !== b.message) {
		return false
	}
	if (a.stack !== b.stack) {
		return false
	}
	return true
}

export function DevErrorManager(props: DevErrorManagerProps) {
	const [errors, setErrors] = useState<{ error: ErrorType; source: string }[]>([])
	const [errIndex, setErrorIndex] = useState(0)
	const [open, setOpen] = useState(false)

	useEffect(
		() => {
			return props.bus.register(err => {
				setTimeout(
					() => {
						setErrors(errors => {
							return !errors.find(it => compareErrors(it.error, err.error)) ? [err, ...errors] : errors
						})
						setOpen(true)
					},
					0,
				)
			})
		},
		[props.bus],
	)

	const currentError = errors[errIndex]
	const processedError = useProcessedError(currentError?.error)
	if (!currentError) {
		return null
	}
	const onPrevious = () => setErrorIndex(it => Math.max(0, it - 1))
	const onNext = () => setErrorIndex(it => Math.min(errors.length - 1, it + 1))
	const onClose = () => setOpen(false)
	if (!open) {
		return <DevErrorBadge errorCount={errors.length} onOpen={() => setOpen(true)} />
	}
	return (
		<DevErrorList
			currentError={processedError}
			currentErrorSource={currentError.source}
			currentErrorIndex={errIndex}
			errorCount={errors.length}
			onPrevious={onPrevious}
			onNext={onNext}
			onClose={onClose}
		/>
	)
}
