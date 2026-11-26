import { GlobalRegistrator } from '@happy-dom/global-registrator'

const { AbortController, AbortSignal } = globalThis
GlobalRegistrator.register()
// Bun's fetch (1.4+) rejects a signal that is not its own AbortSignal, so happy-dom's would fail every fetch made with one.
Object.assign(globalThis, { AbortController, AbortSignal })
