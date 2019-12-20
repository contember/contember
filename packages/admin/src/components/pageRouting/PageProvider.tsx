export interface PageProvider<P = {}> {
	getPageName(props: P): string
}
