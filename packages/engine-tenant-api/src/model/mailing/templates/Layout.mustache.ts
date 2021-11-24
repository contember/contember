// language=Mustache
export default (inner: string) => `
	<div style="background:#f8f8f8;padding: 50px 10px;font-family:sans-serif;line-height:25px;color:#444;">
		<div style="background-color:#ffffff;max-width:600px;margin:0 auto;padding:15px 30px;border-radius:6px;border:1px solid #ddd;">
			${inner}
		</div>
	</div>
`
