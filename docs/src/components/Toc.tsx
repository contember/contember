import type { TocItem } from '../lib/toc'

export default function Toc(props: { items: TocItem[] }) {
	return (
		<nav className="toc" aria-label="On this page">
			<div className="toc__title">On this page</div>
			<ul className="toc__list">
				{props.items.map((item) => (
					<li className={`toc__item toc__item--h${item.depth}`}>
						<a className="toc__link" href={`#${item.id}`}>
							{item.text}
						</a>
					</li>
				))}
			</ul>
		</nav>
	)
}
