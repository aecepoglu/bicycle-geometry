// Virtual DOM
import vdomCreate from "virtual-dom/create-element"
import vdomDiff from "virtual-dom/diff"
import h from "virtual-dom/h"
import vdomPatch from "virtual-dom/patch"
// Algebraic types
import IO from "crocks/IO"
import Maybe from "crocks/Maybe"
import Pair from "crocks/Pair"
// Helpers
import applyTo from "crocks/combinators/applyTo"
import assign from "crocks/helpers/assign"
import bimap from "crocks/pointfree/bimap"
import branch from "crocks/Pair/branch"
import chain from "crocks/pointfree/chain"
import compose from "crocks/helpers/compose"
import constant from "crocks/combinators/constant"
import curry from "crocks/helpers/curry"
import identity from "crocks/combinators/identity"
import either from "crocks/pointfree/either"
import flip from "crocks/combinators/flip"
import head from "crocks/pointfree/head"
import liftA2 from "crocks/helpers/liftA2"
import map from "crocks/pointfree/map"
import mapProps from "crocks/helpers/mapProps"
import maybeToEither from "crocks/Either/maybeToEither"
import merge from "crocks/pointfree/merge"
import omit from "crocks/helpers/omit"
import path from "crocks/Maybe/propPath"
import pick from "crocks/helpers/pick"
import reduce from "crocks/pointfree/reduce"
import run from "crocks/pointfree/run"
import runWith from "crocks/pointfree/runWith"
import safe from "crocks/Maybe/safe"
import setPath from "crocks/helpers/setPath"
import snd from "crocks/Pair/snd"
import tap from "crocks/helpers/tap"
import withDefault from "crocks/pointfree/option"

import SafeModel from "./model"

/*
 * Helpers
 */

// $ :: String -> IO DOM
const $ = sel => IO.of(document.querySelector(sel))

// replaceDomWith :: (String, DOMNode) -> ()
const replaceDomWith = curry((sel, dom) => map(
	io => io.replaceWith(dom),
	$(sel)
))

// domPatch :: String -> DOMNode -> IO Function
const domPatch = sel => dom => $(sel).map(t => {
	console.log("permforming IO domPatch")
	return vdomPatch(t, dom)
})

// domDiff :: VTree -> VTree -> Diff
const domDiff = curry(vdomDiff)

// svg, same as h
const svg = (a, b, c) => h(
	a,
	Array.isArray(b)
		? b
		: assign(
			pick(["style"], b),
			{
				namespace: "http://www.w3.org/2000/svg",
				attributes: omit(["style"], b),
			}
		),
	c
)

// add :: Number -> Number -> Number
const add = curry((a, b) => a + b)
// multiply :: Number -> Number -> Number
const multiply = curry((a, b) => a * b)
// divideBy :: Number -> Number -> Number
const divideBy = curry((b, a) => a / b)

const gt = b => a => a > b
const lt = b => a => a < b

// toRadians :: Degrees -> Radians
const toRadians = multiply(Math.PI / 180)

// toDadians :: Radians -> Degrees
const toDegrees = multiply(180 / Math.PI)

const toFixed = p => x => Math.round(x * p) / p

// toUpper :: String -> String
const toUpper = x => x.toUpperCase()

// TODO use crocks/Maybe/safe instead
// parseFloatSafe :: String -> Maybe Float
const parseFloatSafe = map(x => Number.isNaN(x) ? Maybe.Nothing() : Maybe.Just(x), parseFloat)

// limitedMemoize :: (* -> a) -> (* -> a)
const limitedMemoize = f => {
	let prevKey = undefined
	let prevResp = undefined
	return (...args) => {
		let key = JSON.stringify(args)
		if (key !== prevKey) {
			prevKey = key
			prevResp = f(...args)
		}
		return prevResp
	}
}

// join :: String -> List String -> String
const join = t => l => l.join(t)
// spaced :: List String -> String
const spaced = join(" ")

// point :: (Number, Number) -> Point
const point = (x, y) => ({x: x, y: y})
// addVector :: (Point, Point) -> Point
const addPoints = (a, b) => point(a.x + b.x, a.y + b.y)
// avector :: (Number, Angle) -> Point
const subPoints = (a, b) => point(a.x - b.x, a.y - b.y)
// avector :: (Number, Angle) -> Point
const avector = (l, a) => point(l * Math.cos(a), l * Math.sin(a))

const vectorLen = p => Math.sqrt(p.x*p.x + p.y*p.y)

// print :: String -> a -> a
const print = curry((prefix, x) => {
	console.log(prefix, x)
	return x
})

/*
 *
 * Model Initialization
 *
 */

// Model myModel 
let myModel = new SafeModel()
// getModel :: () -> Model
const getModel = () => myModel.get()
// setModel :: Model -> IO Model
const setModel = x => new IO(() => {
	console.log("performing IO setModel")
	return myModel.set(x)
})

/*
 *
 * Utilities
 *
 */

const round = toFixed(10)

// changeTube :: [String] -> Model -> a -> Model
const changeTube = curry((path, model, val) => {
	return setPath(path, val, model)
})

const svgd = op => (x, y) => "" + op + round(x) + " " + round(y)
const svgl = svgd("l")
const svgM = svgd("M")
const svgv = op => (l, a) => svgd(op)(l * Math.cos(a), l * Math.sin(a))
const svgline = svgv("l")
const svgdp = op => p => svgd(op)(p.x, p.y)

// svgtube :: (Number, Number, Angle) -> String
const svgtube = (l, t, a) => spaced([
	svgline(t, Math.PI/2 + a),
	svgline(l, a),
	svgline(2 * t, -Math.PI/2 + a),
	svgline(l, Math.PI + a),
	svgline(t, Math.PI/2 + a),
])

const svgtubebetween = (p0, p1, t) => {
	let dx = p1.x - p0.x
	let dy = p1.y - p0.y
	return svgtube(Math.sqrt(dy * dy + dx * dx), t, Math.atan2(dy, dx))
}

const svgpath = dl => svg("path", {d: spaced(dl)})

// render :: Model -> VTree
const createBicycleSvg = compose(
	model => svg("svg", {
	
		style: {
			stroke: "grey",
			border: "1px solid grey",
		},
		viewBox: "0 0 700 550",
	}, [
		svg("circle", {
			cx: model.pan.x,
			cy: model.pan.y,
			r: 4,
			fill: "grey",
		}),
		svgpath([ //top tube
			svgdp("M")(model.topTubeStart),
			svgtube(model.topTubeLen, model.tubeThickness, model.topTubeAngle),
		]),
		svgpath([ //bottom tube
			svgdp("M")(model.bb),
			svgtubebetween(model.bb, model.bottomTubeEnd, model.tubeThickness),
		]),
		svgpath([ //head tube
			svgdp("M")(model.headTubeStart),
			svgtube(model.headTubeLen, model.tubeThickness, model.headTubeAngle),
		]),
		svgpath([ //seat tube
			svgdp("M")(model.bb),
			svgtube(model.seatTubeLen + model.topTubeOffset, model.tubeThickness, model.seatTubeAngle),
		]),
		svgpath([ //chainstay
			svgdp("M")(model.bb),
			svgtubebetween(model.bb, model.rearHub, model.tubeThickness / 2),
		]),
		svgpath([ //chainstay
			svgdp("M")(model.rearHub),
			svgtubebetween(model.rearHub, model.topTubeEnd, model.tubeThickness / 2),
		]),
		svg("circle", { //bottom bracket
			cx: model.bb.x,
			cy: model.bb.y,
			r: model.tubeThickness,
		}),
		svg("circle", {
			cx: model.frontHub.x,
			cy: model.frontHub.y,
			r: 2,
			fill: "yellow",
		}),
		svg("circle", {
			cx: model.rearHub.x,
			cy: model.rearHub.y,
			r: 2,
			fill: "yellow",
		}),
		svgpath([ //fork
			svgdp("M")(model.frontHub),
			svgdp("Q ")(model.headTubeProjection),
			svgdp(" ")(model.headTubeStart),
		]),
		svg("circle", {
			cx: model.headTubeProjection.x,
			cy: model.headTubeProjection.y,
			r: 2,
		}),
		svg("circle", {
			cx: model.topTubeStart.x,
			cy: model.topTubeStart.y,
			r: 1,
			fill: "grey",
		}),
		svg("circle", {
			cx: model.bottomTubeEnd.x,
			cy: model.bottomTubeEnd.y,
			r: 1,
			fill: "grey",
		}),
		svg("circle", {
			cx: model.topTubeEnd.x,
			cy: model.topTubeEnd.y,
			r: 1,
			fill: "grey",
		}),
	]),
	print(undefined),
	model => {
		let panX = add(model.pan.x)
		let panY = add(model.pan.y)
		let zoom = multiply(model.zoom)
		let panzoomX = compose(round, panX, zoom)
		let panzoomY = compose(round, panY, zoom)
		let panzoomp = {x: panzoomX, y: panzoomY}
		let zoomp = {x: zoom, y: zoom}
		let panp = {x: panX, y: panY}

		return mapProps({
			//tubeThickness: zoom,
			frontHub: panzoomp,
			rearHub: panzoomp,
			forkLen: zoom,
			headTubeLen: zoom,
			topTubeLen: zoom,
			seatTubeLen: zoom,
			topTubeOffset: zoom,
			headTubeProjection: panzoomp,
			headTubeStart: panzoomp,
			headTubeEnd: panzoomp,
			topTubeStart: panzoomp,
			bottomTubeEnd: panzoomp,
			topTubeEnd: panzoomp,
			bb: panzoomp,
		}, model)
	}
)



// -> Maybe IO
const evthandler = (attrpath, model) => compose(
	//Maybe IO Node
	map(chain(domPatch("#root"))),
	//Maybe IO Diff
	map(map(domDiff(createTreeOnce(model)))),
	//Maybe IO VTree
	map(map(createTree)),
	//Maybe IO Model
	map(setModel),
	//Maybe Model
	map(changeTube(attrpath, model))
	//Maybe a
)

// createInputsTree :: Model -> VTree
const createInputsTree = model => h("div.inputs", [
	{
		path: ["topTubeLen"],
		label: "effective top tube length",
		formatForHumans: identity,
		formatForCalculations: safe(gt(0)),
	},
	{
		path: ["forkLen"],
		label: "fork length",
		formatForHumans: identity,
		formatForCalculations: safe(gt(4 * model.forkOffset)),
	},
	{
		path: ["headTubeAngle"],
		label: "head tube angle",
		step: 0.1,
		formatForHumans: compose(
			round,
			toDegrees,
			multiply(-1)
		),
		formatForCalculations: compose(
			map(multiply(-1)),
			map(toRadians),
			chain(safe(lt(90))),
			safe(gt(0))
		),
	},
	{
		path: ["seatTubeAngle"],
		label: "seat tube angle",
		step: 0.1,
		formatForHumans: compose(
			round,
			toDegrees,
			multiply(-1)
		),
		formatForCalculations: compose(
			map(multiply(-1)),
			map(toRadians),
			chain(safe(lt(90))),
			safe(gt(0))
		),
	},
	{
		path: ["calculatedChainstay"],
		label: "(chainstay length)",
		formatForHumans: round,
		formatForCalculations: Maybe.Nothing,
		disabled: true,
	},
	{
		path: ["calculatedBbDrop"],
		label: "(bb drop)",
		formatForHumans: round,
		formatForCalculations: Maybe.Nothing,
		disabled: true,
	},
	{
		path: ["calculatedReach"],
		label: "(reach)",
		formatForHumans: round,
		formatForCalculations: Maybe.Nothing,
		disabled: true,
	},
].map(x => h("div", [
	h("span", {
		style: {
			"text-transform": "capitalize",
		},
	}, (x.label || x.path.join(" "))),
	h("input", {
		type: "number",
		step: x.step || 1,
		value: x.formatForHumans(withDefault(0, path(x.path, model))),
		disabled: x.disabled,
		onchange: compose(
			tap(() => console.log("END RUN")),
			map(run),
			tap(() => console.log("BEGIN RUN")),
			//Maybe IO
			chain(evthandler(x.path, model)),
			//Maybe a
			map(x.formatForCalculations),
			//Maybe Float
			chain(parseFloatSafe),
			//Maybe String
			path(["target", "value"])
			//Event
		),
	}),
])))

// createTree :: Model -> VTree
const createTree = compose(
	model => h("div#root", [
		//h("pre.debug", [JSON.stringify(model, null, 2)]),
		createInputsTree(model),
		createBicycleSvg(model),
	]),
	flip(reduce((x, f) => {
		//debugger
		return f(x)
	})) ([
		x => assign({
			frontHub: point(0, 0),
			rearHub: point(x.wheelbaseLen, 0),
			headTubeProjection: point(x.forkOffset / Math.sin(Math.abs(x.headTubeAngle)), 0),
			forkAngle: (x.headTubeAngle < 0 ? -1 : +1) * (Math.abs(x.headTubeAngle) - Math.asin(x.forkOffset / x.forkLen)),
			topTubeOffset: x.headTubeLen / 4,
			bottomTubeOffset: x.headTubeLen*3 / 4,
		}, x),
		x => assign({
			headTubeStart: addPoints(x.frontHub, avector(x.forkLen, x.forkAngle)),
		}, x),
		x => assign({
			headTubeEnd: addPoints(x.headTubeStart, avector(x.headTubeLen, x.headTubeAngle)),
			topTubeStart: addPoints(x.headTubeStart, avector(x.headTubeLen - x.topTubeOffset, x.headTubeAngle)),
			bottomTubeEnd: addPoints(x.headTubeStart, avector(x.headTubeLen - x.bottomTubeOffset, x.headTubeAngle)),
		}, x),
		x => assign({
			topTubeEnd: addPoints(x.topTubeStart, avector(x.topTubeLen, x.topTubeAngle)),
		}, x),
		x => assign({
			bb: addPoints(x.topTubeEnd, avector(x.seatTubeLen - x.tubeThickness / Math.abs(Math.sin(x.seatTubeAngle)), x.seatTubeAngle + Math.PI)),
		}, x),
		x => assign({
			calculatedChainstay: vectorLen(subPoints(x.rearHub, x.bb)),
			calculatedBbDrop: Math.abs(x.bb.y - x.frontHub.y),
			calculatedReach: Math.abs(x.bb.x - x.headTubeEnd.x),
		}, x),
	])
)

// createTreeOnce :: Model -> VTree
const createTreeOnce = limitedMemoize(createTree)
run(setModel({
	forkLen: 390,
	forkOffset: 45,
	headTubeLen: 110.7,
	//calculated topTubeOffset: 110.7 / 3, //offset where top-tube connects head-tube
	//calculated bottomTubeOffset: 2 * 110.7 / 3, //offset where bottom-tube connects head-tube
	headTubeAngle: toRadians(-72),
	topTubeLen: 570, //effective
	topTubeAngle: toRadians(0),
	seatTubeLen: 560,
	seatTubeAngle: toRadians(-73),
	wheelbaseLen: 1055.6,
	tubeThickness: 5,
	zoom: 0.5,
	pan: point(100, 300),
}))
run(replaceDomWith(
	"#root",
	vdomCreate(createTree(getModel()))
))
