class Emitter {
	// constructor => (() -> f a) -> Emitter a
	constructor() {
		this._listeners = [];
	}

	// map :: Emitter a -> (a -> b) -> Emitter b
	subscribe(f) {
		if (!this._listeners.includes(f)) {
			this._listeners.push(f);
		}

		return this;
	}

	emit(a) {
		this._listeners.forEach(f => f(a));

		return a;
	}

	static fromResultOf(f) {
		let e = new Emitter();
		f(e.emit.bind(e));
		return e;
	}

	toString() {
		return "an Emitter";
	}
}

export default Emitter;
