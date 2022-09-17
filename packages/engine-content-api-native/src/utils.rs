use neon::prelude::*;

trait IntoCustomIterator {
	type Item;
	type IntoIter: Iterator<Item = Self::Item>;

	fn into_custom_iter(self) -> Self::IntoIter;
}

struct CustomJsArrayIterator<'a> {
	cx: &'a mut FunctionContext<'_>,
	index: u32,
	array: JsArray,
}

impl Iterator for CustomJsArrayIterator<'_> {
	type Item = Handle<'_, JsValue>;

	fn next(&mut self) -> Option<Self::Item> {
		let index = self.index;
		self.index += 1;

		self.array.get_value(self.cx, index).ok()
	}
}
