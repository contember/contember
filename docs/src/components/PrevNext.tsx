import type { DocMeta } from '../lib/docs'

export default function PrevNext(props: { prev?: DocMeta; next?: DocMeta }) {
	if (!props.prev && !props.next) return <></>
	return (
		<nav className="pagination-nav" aria-label="Documentation pages">
			{props.prev ? (
				<a className="pagination-nav__link pagination-nav__link--prev" href={props.prev.href}>
					<span className="pagination-nav__sublabel">Previous</span>
					<span className="pagination-nav__label">{props.prev.title}</span>
				</a>
			) : (
				<span />
			)}
			{props.next ? (
				<a className="pagination-nav__link pagination-nav__link--next" href={props.next.href}>
					<span className="pagination-nav__sublabel">Next</span>
					<span className="pagination-nav__label">{props.next.title}</span>
				</a>
			) : (
				<span />
			)}
		</nav>
	)
}
