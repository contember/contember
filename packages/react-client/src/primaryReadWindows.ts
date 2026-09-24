import { PrimaryReadWindow } from '@contember/graphql-client'
import { createContext } from '@contember/react-utils'

/** One window per Content API URL and identity, so a mutation never forces reads of another identity or origin. */
export class PrimaryReadWindows {
	private readonly windows = new Map<string, PrimaryReadWindow>()

	constructor(private readonly durationMs: number) {}

	get(url: string, apiToken: string | undefined): PrimaryReadWindow {
		const key = JSON.stringify([url, apiToken ?? null])
		let window = this.windows.get(key)
		if (window === undefined) {
			window = new PrimaryReadWindow({ durationMs: this.durationMs })
			this.windows.set(key, window)
		}
		return window
	}
}

const PrimaryReadWindowsContext_ = createContext<PrimaryReadWindows | undefined>('PrimaryReadWindowsContext', undefined)

export const PrimaryReadWindowsContext = PrimaryReadWindowsContext_[0]
export const usePrimaryReadWindows = PrimaryReadWindowsContext_[1]
