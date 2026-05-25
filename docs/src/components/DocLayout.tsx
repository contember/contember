import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Toc from './Toc'
import PrevNext from './PrevNext'
import Breadcrumbs from './Breadcrumbs'
import AnnouncementBar from './AnnouncementBar'
import Footer from './Footer'
import type { TocItem } from '../lib/toc'
import type { DocMeta } from '../lib/docs'

const DEFAULT_DESCRIPTION =
	'Contember is an open source platform that empowers developers to quickly build and manage data-driven web applications.'

export interface DocLayoutProps {
	title: string
	description?: string
	html: string
	docId: string
	toc: TocItem[]
	byId: Map<string, DocMeta>
	prev?: DocMeta
	next?: DocMeta
	trail: string[]
}

export default function DocLayout(props: DocLayoutProps) {
	const pageTitle = props.title ? `${props.title} | Contember` : 'Contember'
	const description = props.description ?? DEFAULT_DESCRIPTION

	return (
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>{pageTitle}</title>
				<meta name="description" content={description} />
				<link rel="icon" href="/img/favicon.png" />
				<meta name="twitter:card" content="summary" />
				<meta name="twitter:site" content="@contember" />
				<meta name="twitter:title" content={pageTitle} />
				<meta name="twitter:description" content={description} />
				<meta name="twitter:image" content="https://docs.contember.com/img/contember-for-twitter.png" />
				<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@docsearch/css@3" />
				<link rel="stylesheet" href="/docs.css" />
			</head>
			<body>
				<AnnouncementBar />
				<Navbar />
				<div className="layout">
					<aside className="layout__sidebar">
						<Sidebar activeId={props.docId} byId={props.byId} />
					</aside>
					<main className="layout__main">
						<article className="doc">
							<Breadcrumbs trail={props.trail} title={props.title} />
							<div className="doc__content markdown" dangerouslySetInnerHTML={{ __html: props.html }} />
							<PrevNext prev={props.prev} next={props.next} />
						</article>
					</main>
					<aside className="layout__toc">{props.toc.length > 0 ? <Toc items={props.toc} /> : <></>}</aside>
				</div>
				<Footer />
			</body>
		</html>
	)
}
