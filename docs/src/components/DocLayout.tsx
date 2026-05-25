import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Toc from './Toc'
import PrevNext from './PrevNext'
import Breadcrumbs from './Breadcrumbs'
import Footer from './Footer'
import type { TocItem } from '../lib/toc'
import type { DocMeta } from '../lib/docs'

const DEFAULT_DESCRIPTION =
	'Contember is an open source platform that empowers developers to quickly build and manage data-driven web applications.'

/** Runs before paint to set the theme and avoid a flash of the wrong mode. */
const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})();`

/** Wires the theme toggle, code-block chrome, heading anchors and TOC scroll-spy. */
const BEHAVIOR = `
(function(){
	var btn=document.getElementById('theme-toggle');
	if(btn){btn.addEventListener('click',function(){
		var next=document.documentElement.dataset.theme==='dark'?'light':'dark';
		document.documentElement.dataset.theme=next;
		try{localStorage.setItem('theme',next);}catch(e){}
	});}

	// Code block chrome: wrap each highlighted block, add a language label + copy button.
	document.querySelectorAll('.markdown pre.shiki').forEach(function(pre){
		var wrap=document.createElement('div');wrap.className='code-block';
		pre.parentNode.insertBefore(wrap,pre);wrap.appendChild(pre);
		var bar=document.createElement('div');bar.className='code-block__bar';
		var lang=(pre.getAttribute('data-lang')||'').toLowerCase();
		var label=document.createElement('span');label.className='code-block__lang';
		label.textContent=(lang&&lang!=='text'&&lang!=='plaintext')?lang:'';
		var copy=document.createElement('button');copy.type='button';copy.className='code-block__copy';copy.setAttribute('aria-label','Copy code');copy.textContent='Copy';
		copy.addEventListener('click',function(){
			var code=pre.querySelector('code');var text=(code||pre).innerText;
			navigator.clipboard.writeText(text).then(function(){
				copy.textContent='Copied';copy.classList.add('is-copied');
				setTimeout(function(){copy.textContent='Copy';copy.classList.remove('is-copied');},1600);
			});
		});
		bar.appendChild(label);bar.appendChild(copy);wrap.appendChild(bar);
	});

	// Heading anchor links on hover.
	document.querySelectorAll('.markdown h2[id], .markdown h3[id]').forEach(function(h){
		var a=document.createElement('a');a.className='heading-anchor';a.href='#'+h.id;a.setAttribute('aria-label','Link to this section');a.textContent='#';
		h.appendChild(a);
	});

	// TOC scroll-spy.
	var links=Array.prototype.slice.call(document.querySelectorAll('.toc__link'));
	if(!links.length)return;
	var map=new Map();
	links.forEach(function(l){var id=decodeURIComponent((l.hash||'').slice(1));var el=id&&document.getElementById(id);if(el)map.set(el,l);});
	var current=null;
	var obs=new IntersectionObserver(function(entries){
		entries.forEach(function(e){if(e.isIntersecting)current=e.target;});
		if(current){links.forEach(function(l){l.classList.remove('toc__link--active');});var a=map.get(current);if(a)a.classList.add('toc__link--active');}
	},{rootMargin:'0px 0px -75% 0px',threshold:0});
	map.forEach(function(_,el){obs.observe(el);});
})();
`

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
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
				/>
				<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@docsearch/css@3" />
				<link rel="stylesheet" href="/docs.css" />
			</head>
			<body>
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
				<script dangerouslySetInnerHTML={{ __html: BEHAVIOR }} />
			</body>
		</html>
	)
}
