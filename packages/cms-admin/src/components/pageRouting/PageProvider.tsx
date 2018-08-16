export default interface PageProvider<P = {}> {
	getPageName(props: P): string
}
