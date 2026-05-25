import Search from './Search'

export default function Navbar() {
	return (
		<header className="navbar">
			<div className="navbar__inner">
				<a className="navbar__brand" href="http://www.contember.com/">
					<img src="/img/contember-horizontal-blue.svg" alt="Contember" height={28} />
				</a>
				<nav className="navbar__links" aria-label="Main">
					<a href="https://docs.contember.com">Docs</a>
					<a href="https://blog.contember.com">Blog</a>
					<a href="https://github.com/orgs/contember/discussions">Support</a>
				</nav>
				<div className="navbar__right">
					<Search />
					<a className="navbar__icon" href="https://github.com/contember">GitHub</a>
					<a className="navbar__icon" href="https://www.youtube.com/@cntmbr">YouTube</a>
				</div>
			</div>
		</header>
	)
}
