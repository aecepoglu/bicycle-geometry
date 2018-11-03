import {
	chain,
	compose,
	curry,
	curryN,
	divide,
	head,
	map,
	path,
	prop
} from "ramda";

import IO from "./types/io";
import Emitter from "./types/emitter";


// point :: (Number, Number) -> Point
const point = (x, y) => ({
	x: x,
	y: y
});


// radians :: Number -> Angle
const radians = divide(2 * Math.PI);

// tube :: (String, Float, Point, Angle) -> 
const tube = (name, length, P, angle) => ({
	name: name,
	length: length,
	P: P,
	angle: angle
});

const print = curry((prefix, x) => {
	console.log(prefix + " " + x);
	return x;
});

// pprintIO :: String -> a -> IO a
const pprintIO = prefix => (x => new IO(() => print(prefix, x)));

// pprintIO :: a -> IO a
const printIO = pprintIO("PRINT");

// $ :: String -> IO DOM
const $ = sel => IO.of(document.querySelector(sel));

const setHtml = curry((path, html) => { //TODO this should return an IO
	document.querySelector(path).innerHTML = html;
});

// listevEvents :: IO Textbox -> Emitter ChangeEvent
const listenEvents = (io, ev) => compose(
	//// EventEmitter ChangeEvent
	map(Emitter.fromResultOf),
	//// IO f(cb)
	chain(pprintIO("3")),
	map(f => curryN(2, f)(ev)), //TODO curry this too
	//// IO f(ev, cb)
	chain(pprintIO("2")),
	map(prop("addEventListener")),
	// IO Textbox
	chain(pprintIO("1")),
	$,
)(io, ev);

console.log($("#forkLen").performUnsafeIO());
console.log(
	listenEvents("#forkLen", "change")
		.performUnsafeIO()
		.subscribe(compose(
			setHtml("#forkLenOut"),
			print("float"),
			parseFloat,
			print("string"),
			path(["target", "value"]),
			print("event")
		))
);
