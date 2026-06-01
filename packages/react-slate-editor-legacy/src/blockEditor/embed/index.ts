export * from './core/index.js'
import { GoogleForm, SoundCloud, Spotify, Vimeo, YouTube } from './handlers/index.js'

// TODO use export * as EmbedHandlers from './handlers/index.js' once the tooling is ready.
export const EmbedHandlers = {
	GoogleForm,
	YouTube,
	Vimeo,
	SoundCloud,
	Spotify,
}
