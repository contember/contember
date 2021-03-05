export * from './core'
import { GoogleForm, Vimeo, YouTube } from './handlers'

// TODO use export * as EmbedHandlers from './handlers' once the tooling is ready.
export const EmbedHandlers = {
	GoogleForm,
	YouTube,
	Vimeo,
}
