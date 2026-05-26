export default function Breadcrumbs(props: { trail: string[]; title: string }) {
	return (
		<nav className="breadcrumbs" aria-label="Breadcrumbs">
			<a className="breadcrumbs__item" href="/">Docs</a>
			{props.trail.map((label) => (
				<span className="breadcrumbs__item">{label}</span>
			))}
			<span className="breadcrumbs__item breadcrumbs__item--active">{props.title}</span>
		</nav>
	)
}
