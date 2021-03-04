declare module 'react' {
	interface IframeHTMLAttributes<T> {
		loading?: 'lazy' | 'eager'
	}
}
