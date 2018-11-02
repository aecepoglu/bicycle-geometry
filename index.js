import {
	chain,
	compose,
	curry,
	divide,
	head,
	map
} from "ramda";

import IO from "./types/io";


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

// print :: a -> IO a
const print = x => new IO(() => {
	console.log("PRINT " + x);
	return x;
});

// print :: String -> IO List DOM
const elements = sel => IO.of(document.querySelectorAll(sel));

// print :: String -> IO DOM
const element = compose(map(head), elements);

// addListener :: String -> String -> f Event
const addListener = curry((sel, ev, f) => {
	document.querySelector(sel).addEventListener(ev, f);
});

//addListener("#forkLen") ("change") (x => {
//	XXXX.pipe([
//		XXXX.parseFloat,
//		XXXX.maybeToEither("Not a number"),
//		XXXX.either
//			(console.warn)
//			(x => document.querySelector("#forkLenOut").innerHTML = x)
//	]) (x.target.value)
//});

console.log(
	element("#forkLen").performUnsafeIO()
);
