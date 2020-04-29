import * as React from 'react'

declare module 'react' {
	interface IframeHTMLAttributes<T> {
		loading?: 'lazy' | 'eager'
	}
}
