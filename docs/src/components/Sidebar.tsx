import { nav, type NavItem } from '../lib/nav'
import type { DocMeta } from '../lib/docs'

function containsActive(items: NavItem[], activeId: string): boolean {
	return items.some((item) =>
		item.type === 'doc' ? item.id === activeId : containsActive(item.items, activeId),
	)
}

function renderItems(items: NavItem[], activeId: string, byId: Map<string, DocMeta>) {
	return (
		<ul className="sidebar__list">
			{items.map((item) => {
				if (item.type === 'doc') {
					const meta = byId.get(item.id)
					const href = meta?.href ?? `/${item.id}`
					const label = item.label ?? meta?.title ?? item.id
					const active = item.id === activeId
					return (
						<li className="sidebar__item">
							<a
								className={active ? 'sidebar__link sidebar__link--active' : 'sidebar__link'}
								href={href}
								aria-current={active ? 'page' : undefined}
							>
								{label}
							</a>
						</li>
					)
				}
				const open = item.collapsed === false || containsActive(item.items, activeId)
				return (
					<li className="sidebar__category">
						<details open={open}>
							<summary className="sidebar__category-label">{item.label}</summary>
							{renderItems(item.items, activeId, byId)}
						</details>
					</li>
				)
			})}
		</ul>
	)
}

export default function Sidebar(props: { activeId: string; byId: Map<string, DocMeta> }) {
	return (
		<nav className="sidebar" aria-label="Documentation">
			{renderItems(nav, props.activeId, props.byId)}
		</nav>
	)
}
