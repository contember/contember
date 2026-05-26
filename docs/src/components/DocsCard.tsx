interface Props {
	href?: string
	header?: string
	children?: unknown
}

/**
 * A single card. Internal links render as a plain `<a>`; external links get
 * `target="_blank"`. Without `href` it is a static, non-clickable card.
 * Replaces the former Docusaurus-coupled component (no `@docusaurus/Link`,
 * `useBaseUrl`, or CSS modules).
 */
export default function DocsCard(props: Props) {
	const inner = (
		<>
			{props.header && (
				<span className="docs-card__header">
					<span>{props.header}</span>
					<span aria-hidden="true">→</span>
				</span>
			)}
			<span className="docs-card__body">{props.children}</span>
		</>
	)

	if (!props.href) {
		return <div className="docs-card">{inner}</div>
	}

	const isOutbound = /^https?:\/\//.test(props.href)
	const outboundProps = isOutbound ? { target: '_blank', rel: 'noreferrer' } : {}
	return (
		<a className="docs-card" href={props.href} {...outboundProps}>
			{inner}
		</a>
	)
}
