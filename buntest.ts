import { GlobalRegistrator } from '@happy-dom/global-registrator'

const { AbortController, AbortSignal } = globalThis
GlobalRegistrator.register()
// Bun's fetch (1.4+) rejects a signal that is not its own AbortSignal, so happy-dom's would fail every fetch made with one.
// The global fetch stays happy-dom's, and it does not see that a native signal is already aborted: test aborts through Bun.fetch.
Object.assign(globalThis, { AbortController, AbortSignal })
