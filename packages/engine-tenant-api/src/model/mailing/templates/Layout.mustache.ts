// language=Mustache
export default (inner: string) => `
	<div style="background: #fafafa;padding: 50px 10px; font-family: sans-serif; line-height: 25px; color: #444;">
		<div style="background-color:#ffffff;max-width:600px;margin:0 auto; padding: 40px; border-radius: 10px">
			${inner}
		</div>
	</div>
`
