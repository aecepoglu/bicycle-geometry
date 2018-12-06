let myModel = {
}

class Model {
	constructor(x) {
		this._data = x
	}

	get() {
		return this._data
	}

	set(x) {
		this._data = x
		return this.get()
	}

	static create(x) {
		return new Model(x)
	}
}

export default Model

export {
	create,
	get,
	set,
	point,
	tube,
	toRadians,
	toDegrees,
}
