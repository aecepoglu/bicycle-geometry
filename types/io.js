import {ap, chain, join, map, of} from "fantasy-land";

class IO {
	constructor(x) {
		this.performUnsafeIO = x;

		this[ap] = this.ap;
		this[map] = this.map;
		this[chain] = this.chain;
		this[join] = this.join;
	}

	// because Applicative
	ap(fn) {
		return this.chain(fn.map);
	}

	// because Functor
	map(fn) {
		return new IO(
			() => fn(this.performUnsafeIO())
		);
	}

	// because Monad
	chain(fn) {
		return this.map(fn).join();
	}

	// because Monad
	join() {
		return this.performUnsafeIO();
	}

	// because Pointed
	static of(x) {
		return new IO(() => x);
	}

	toString() {
		return `IO ${this.performUnsafeIO()}`;
	}
}

IO[of] = IO.of;

export default IO;
