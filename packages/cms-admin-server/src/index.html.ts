export default function render({
	config,
	assets,
}: {
	config: any
	assets: { js: string | undefined; css: string | undefined }
}): string {
	return `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
	<meta name="viewport" content="width=device-width,initial-scale=1">

	<title>Admin</title>

	<meta name="theme-color" content="#FACB01">
	<link rel="icon" type="image/png" href="/images/icons/36x36.png" sizes="36x36">
	<link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500&subset=latin-ext" rel="stylesheet">
	${assets.css ? `<link rel="stylesheet" href="${assets.css}">` : ''}
</head>
<body>

	<noscript>You need to enable JavaScript to run this app.</noscript>

	<div id="root"></div>

	<script id="admin-config" type="application/json">${JSON.stringify(config)}</script>
	${assets.js ? `<script type="text/javascript" src="${assets.js}"></script>` : ''}
</body>
</html>
`
}
