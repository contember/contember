mod utils;

use neon::prelude::*;

fn log(cx: &mut FunctionContext, msg: &str) -> NeonResult<()> {
	let func = cx.global().get::<JsObject, _, _>(cx, "console")?.get::<JsFunction, _, _>(cx, "log")?;
	let str = cx.string(msg).upcast();
	let null = cx.null();
	func.exec(cx, null, [str])
}

fn json_stringify(cx: &mut FunctionContext, msg: Handle<'_, JsValue>) -> String {
	let func = cx.global().get::<JsObject, _, _>(cx, "JSON").unwrap().get::<JsFunction, _, _>(cx, "stringify").unwrap();
	let null = cx.null();
	let val = func.call(cx, null, [msg]).unwrap();
	let str = val.downcast::<JsString, _>(cx).unwrap().value(cx);
	str
}


fn optimize_and(mut cx: FunctionContext) -> JsResult<JsValue> {
	let operands = cx.argument::<JsArray>(0)?;

	let mut normalized = Vec::new();
	let mut has_always = false;
	for idx in 0..operands.len(&mut cx) {
		let operand = operands.get_value(&mut cx, idx)?;

		if let Ok(bool) = operand.downcast::<JsBoolean, _>(&mut cx) {
			if bool.value(&mut cx) {
				has_always = true;
			} else {
				return Ok(cx.boolean(false).upcast());
			}
		} else if operand.is_a::<JsUndefined, _>(&mut cx) {
			// continue
		} else {
			let operand = operand.downcast_or_throw::<JsObject, _>(&mut cx)?;

			let inner = operand.get_value::<_, _>(&mut cx, "and").ok().and_then(|arr| arr.downcast::<JsArray, _>(&mut cx).ok());
			if let Some(inner) = inner {
				for idx in 0..inner.len(&mut cx) {
					let inner_operand = inner.get(&mut cx, idx)?;
					normalized.push(inner_operand);
				}
			} else {
				normalized.push(operand.upcast());
			}
		}
	}

	match normalized.len() {
		0 => {
			if has_always {
				Ok(cx.boolean(true).upcast())
			} else {
				Ok(cx.empty_object().upcast())
			}
		},
		1 => Ok(normalized.pop().unwrap()),
		_ => {
			let array = cx.empty_array();
			for (idx, operand) in normalized.into_iter().enumerate() {
				array.set(&mut cx, idx as u32, operand)?;
			}

			let result = cx.empty_object();
			result.set(&mut cx, "and", array)?;
			Ok(result.upcast())
		}
	}
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
	cx.export_function("optimizeAnd", optimize_and)?;
	Ok(())
}


