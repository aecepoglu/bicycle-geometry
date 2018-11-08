import {
	chain,
	compose,
	curry,
	curryN,
	divide,
	head,
        identity,
	map,
	path,
	prop,
        toUpper,
} from "ramda"

import IO from "crocks/IO"
import Maybe from "crocks/Maybe"
import Emitter from "./types/emitter"

import maybeToEither from "crocks/Either/maybeToEither"
import either from "crocks/pointfree/either"


// point :: (Number, Number) -> Point
const point = (x, y) => ({
	x: x,
	y: y
})

// radians :: Number -> Angle
const radians = divide(2 * Math.PI)

// tube :: (String, Float, Point, Angle) -> 
const tube = (name, length, P, angle) => ({
	name: name,
	length: length,
	P: P,
	angle: angle
})

// print :: String -> a -> a
const print = curry((prefix, x) => {
	console.log(prefix, x)
	return x
})

// pprintIO :: String -> a -> IO a
const pprintIO = map(IO.of, print)

// pprintIO :: a -> IO a
const printIO = pprintIO("PRINT")

// $ :: String -> IO DOM
const $ = sel => IO.of(document.querySelector(sel))

// setHtml :: String -> String -> IO Node
const setHtml = curry((sel, html) => {
	return map(
		x => {
			x.innerHTML = html
			return x
		},
		$(sel)
	)
})

// parseFloatSafe :: String -> Maybe Float
const parseFloatSafe = map(x => Number.isNaN(x) ? Maybe.Nothing() : Maybe.Just(x), parseFloat)

// listevEvents :: IO Textbox -> Emitter ChangeEvent
const listenEvents = (io, ev) => compose(
	// EventEmitter ChangeEvent
	map(Emitter.fromResultOf),
	// IO f(cb)
	chain(pprintIO("3")),
	map(f => curryN(2, f)(ev)), //TODO curry this too. 'flip' may help
	// IO f(ev, cb)
	chain(pprintIO("2")),
	map(prop("addEventListener")),
	// IO Textbox
	chain(pprintIO("1")),
	$,
)(io, ev)

console.log(setHtml("#forkLenOut")("hello"))
listenEvents("#forkIn > input", "change")
	.run()
	.subscribe(e => {
		compose(
			either(
				compose(
					setHtml("#forkIn > .err"),
					toUpper
				),
				setHtml("#forkLenOut") //TODO also clear out the error
			),
                        maybeToEither("not a number"),
			parseFloatSafe,
			path(["target", "value"]),
		)(e).run()
	})
