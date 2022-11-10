export const abortableTimeout = async (timeoutMs: number, abortSignal: AbortSignal): Promise<void> => {
	if (abortSignal.aborted) {
		return Promise.resolve()
	}

	let cleanup: (() => void)[] = []

	const abortPromise = new Promise(resolve => {
		abortSignal.addEventListener('abort', resolve)
		cleanup.push(() => abortSignal.removeEventListener('abort', resolve))
	})

	const timeoutPromise = new Promise<void>(resolve => {
		const timeoutHandle = setTimeout(resolve, timeoutMs)
		cleanup.push(() => clearTimeout(timeoutHandle))
	})

	await Promise.race([abortPromise, timeoutPromise])
	cleanup.forEach(it => it())
}

