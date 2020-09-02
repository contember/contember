import { GoogleFormEmbedHandler } from './GoogleFormEmbedHandler'
import { VimeoEmbedHandler } from './VimeoEmbedHandler'
import { YouTubeEmbedHandler } from './YouTubeEmbedHandler'

export namespace EmbedHandlers {
	export const GoogleForm = GoogleFormEmbedHandler
	export const Vimeo = VimeoEmbedHandler
	export const YouTube = YouTubeEmbedHandler
}
