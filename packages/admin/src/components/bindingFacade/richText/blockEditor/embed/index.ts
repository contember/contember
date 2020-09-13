export * from './core'
import { GoogleForm, YouTube, Vimeo } from './handlers'

// TODO use export * as EmbedHandlers from './handlers' once the tooling is ready.
export const EmbedHandlers = {
	GoogleForm,
	YouTube,
	Vimeo,
}
