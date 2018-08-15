import * as React from 'react'

export default interface PageProvider<P = {}> {
	getPageName(props: P): string
}
