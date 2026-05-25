export default function Footer() {
	return (
		<footer className="footer">
			<div className="footer__inner">
				<span>Copyright © {new Date().getFullYear()} Contember.com</span>
				<span className="footer__sep" aria-hidden="true">·</span>
				<a href="https://v1.docs.contember.com">v1 docs (legacy)</a>
			</div>
		</footer>
	)
}
