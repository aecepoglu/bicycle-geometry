// Virtual DOM
import vdomCreate from "virtual-dom/create-element"
import vdomDiff from "virtual-dom/diff"
import h from "virtual-dom/h"
import vdomPatch from "virtual-dom/patch"
// Algebraic types
import IO from "crocks/IO"
import List from "crocks/List"
import Maybe from "crocks/Maybe"
import Reader from "crocks/Reader"
// Helpers
import assign from "crocks/helpers/assign"
import chain from "crocks/pointfree/chain"
import compose from "crocks/helpers/compose"
import concat from "crocks/pointfree/concat"
import cons from "crocks/pointfree/cons"
import curry from "crocks/helpers/curry"
import identity from "crocks/combinators/identity"
import fanout from "crocks/helpers/fanout"
import filter from "crocks/pointfree/filter"
import flip from "crocks/combinators/flip"
import head from "crocks/pointfree/head"
import liftA2 from "crocks/helpers/liftA2"
import listToArray from "crocks/List/listToArray"
import map from "crocks/pointfree/map"
import mapProps from "crocks/helpers/mapProps"
import merge from "crocks/pointfree/merge"
import objOf from "crocks/helpers/objOf"
import omit from "crocks/helpers/omit"
import path from "crocks/Maybe/propPath"
import pick from "crocks/helpers/pick"
import prop from "crocks/Maybe/prop"
import reduce from "crocks/pointfree/reduce"
import run from "crocks/pointfree/run"
import runWith from "crocks/pointfree/runWith"
import safe from "crocks/Maybe/safe"
import setPath from "crocks/helpers/setPath"
import sequence from "crocks/pointfree/sequence"
import tail from "crocks/pointfree/tail"
import tap from "crocks/helpers/tap"
import withDefault from "crocks/pointfree/option"

import SafeModel from "./model"
import {listBikes} from "./db"

import "./style.less"

/*
 * Model Initialization
 */

// Model myModel 
let myModel = new SafeModel()
// getModel :: () -> Model
//const getModel = () => myModel.get()
// setModel :: Model -> IO Model
const setModel = x => new IO(() => myModel.set(x))

/*
 * Helpers
 */

const ALT_COLOR = "grey"

// $ :: String -> IO DOM
const $ = sel => IO.of(document.querySelector(sel))

// replaceDomWith :: (String, DOMNode) -> ()
const replaceDomWith = curry((sel, dom) => map(
	io => io.replaceWith(dom),
	$(sel)
))

// domPatch :: String -> DOMNode -> IO Function
const domPatch = sel => dom => $(sel).map(t => vdomPatch(t, dom))

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

const gt = b => a => a > b
const lt = b => a => a < b

// toRadians :: Degrees -> Radians
const toRadians = multiply(Math.PI / 180)

// toDadians :: Radians -> Degrees
const toDegrees = multiply(180 / Math.PI)

const toFixed = p => x => Math.round(x * p) / p

// TODO use crocks/Maybe/safe instead
// parseFloatSafe :: String -> Maybe Float
const parseFloatSafe = map(x => Number.isNaN(x) ? Maybe.Nothing() : Maybe.Just(x), parseFloat)

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

const vectorLen = p => Math.sqrt(p.x * p.x + p.y * p.y)

// print :: String -> a -> a
const print = curry((prefix, x) => {
	console.log(prefix, x)
	return x
})

const inspect = prefix => tap(x => console.log(prefix + " " + x.inspect()))

// mergeListsBy :: ((a, b) -> c) -> ([a], [b]) -> [c]
const mergeListsBy = f => (list1, list2) => list1.map((_, i) => f(list1[i], list2[i]))

// showConfirmDialog :: String -> a -> Maybe a
const showConfirmDialog = text => a => window.confirm(text) ?
	Maybe.Just(a) :
	Maybe.Nothing(a)

Array.of = x => [x]

const COLORS = [
	{name: "black", code: "black"},
	{name: "blue", code: "#228"},
	{name: "red", code: "#B44"},
]

// round :: Number -> Number
const round = toFixed(10)

const svgdp = op => p => `${op}${round(p.x)} ${round(p.y)}`

const svgpath = curry((style, d) => svg("path", ({
	d: d,
	"stroke-dasharray": style == "dashed" ? "3 5" : undefined,
	//deneme: style,
})))

// buildPolygonPath :: LineDef -> String
const buildPolygonPath = compose(
	merge(liftA2(svgpath)),
	map(compose(
		map(spaced),
		map(listToArray),
		merge(flip(concat))
	)),
	map(fanout(
		compose(
			map(List),
			map(svgdp("M")),
			chain(head)
			//TODO check that input is a valid style for 'svg path'
		),
		compose(
			map(map(svgdp("L"))),
			chain(tail)
		)
	)),
	fanout(prop("style"), prop("list"))
)

// svgTrapezoid :: (Point, Point, Number, Number || undefined) -> svg.Path
const svgTrapezoid = (p0, p1, w1, w2) => {
	let v1 = avector(w1, Math.atan2(p1.x - p0.x, p0.y - p1.y))
	let v2 = avector(w2 || w1, Math.atan2(p1.x - p0.x, p0.y - p1.y))

	return withDefault(undefined, buildPolygonPath({
		style: "straight",
		list: List([
			p0, 
			addPoints(p0, v1),
			addPoints(p1, v2),
			subPoints(p1, v2),
			subPoints(p0, v1),
		]),
	}))
}


// (Apply Model -> Maybe List LineDef) -> Maybe Svg.g
const drawGuide = model => compose(
	map(x => svg("g", {
		stroke: "red",
		fill: "none",
	}, x)),
	map(x => x.toArray()),
	sequence(Maybe.of),
	//List Maybe Svg.Path
	map(chain(buildPolygonPath)),
	sequence(List.of),
	//Maybe List LineDef
	runWith(model)
)

// lineDef :: String -> List Point -> LineDef
const lineDef = curry((style, list) => ({style: style, list: list}))

// Guide :: Reader Model -> Maybe List LineDef
// lineThroughPoints :: [String] -> Guide
const lineThroughPoints = compose(
	map(map(map(lineDef("straight")))),
	//Reader Model -> Maybe List List Point
	map(map(List.of)),
	//Reader Model -> Maybe List Point
	map(sequence(Maybe.of)),
	//Reader Model -> List Maybe Point
	sequence(Reader.of),
	//List Reader Model -> Maybe Point
	map(Reader),
	//List Model -> Maybe Point
	map(prop),
	//List String
	List
	//[String]
)

// Creates a guide from point P1 to point P2 (where P1, P2 are Points named `n1` and `n2` in Model
//  such that the line is parallel to the `k` axis
//
// lineFromPointToReferenceLine :: String a, String b => (a, b, a) -> Guide
const lineFromPointToReferenceLine = (n1, k, n2) => compose(
	//Reader Model -> Maybe List (LineDef)
	map(map(({0: pa, 1: pb}) => List([
		lineDef("straight", List([
			pa,
			assign({ [k]: pa[k] }, pb),
		])),
		lineDef("dashed", List([
			pb,
			assign({ [k]: pa[k] - 0.5 * (pb[k] - pa[k]) }, pb),
		])),
	]))),
	map(map(x => x.toArray())),
	//Reader Model -> Maybe (List Point)
	map(sequence(Maybe.of)),
	//Reader Model -> List (Maybe Point)
	sequence(Reader.of),
	//List Reader (Model -> Maybe Point)
	map(Reader),
	//TODO validate using (Point.isPoint :: a -> Maybe Point)
	//List (Model -> Maybe Point)
	map(prop)
	//List String String
)(
	List([n1, n2])
)

// render :: Model -> VTree
const createBicycleSvg = compose(
	model => svg("svg", {
		style: {
			fill: model.fillColor,
		},
		viewBox: "0 0 700 550",
	}, [
		// top tube
		svgTrapezoid(model.topTubeEnd, model.topTubeStart, model.thickness),
		// bottom tube
		svgTrapezoid(model.bb, model.bottomTubeStart, model.thickness),
		// seat tube
		svgTrapezoid(model.bb, model.seatTubeEnd, model.thickness),
		// chainstay
		svgTrapezoid(model.bb, model.rearHub, 0.7 * model.thickness, 0.3 * model.thickness),
		// head tube
		svgTrapezoid(model.headTubeStart, model.headTubeEnd, 1.2 * model.thickness),
		// seat stay
		svgTrapezoid(model.rearHub, model.topTubeEnd, 0.5 * model.thickness, 0.8 * model.thickness),
		// fork crown
		svgTrapezoid(model.headTubeStart, model.forkStart, 1.5 * model.thickness),
		svg("circle", { //bottom bracket
			cx: model.bb.x,
			cy: model.bb.y,
			r: model.thickness * 1.2,
		}),
		svg("circle", {
			cx: model.frontHub.x,
			cy: model.frontHub.y,
			r: 2,
			fill: ALT_COLOR,
		}),
		svg("circle", {
			cx: model.rearHub.x,
			cy: model.rearHub.y,
			r: 2,
			fill: ALT_COLOR,
		}),
		svg("path", {
			d: spaced([ //fork
				svgdp("M")(model.frontHub),
				svgdp("Q ")(model.headTubeProjection),
				svgdp(" ")(model.forkStart),
			]),
			stroke: model.fillColor,
			fill: "none",
			"stroke-width": "2",
			"stroke-dasharray": "5, 3",
		}),
		svg("circle", {
			cx: model.headTubeProjection.x,
			cy: model.headTubeProjection.y,
			fill: "none",
		}),
		svg("circle", {
			cx: model.topTubeStart.x,
			cy: model.topTubeStart.y,
			r: 1,
			fill: ALT_COLOR,
		}),
		svg("circle", {
			cx: model.bottomTubeStart.x,
			cy: model.bottomTubeStart.y,
			r: 1,
			fill: ALT_COLOR,
		}),
		svg("circle", {
			cx: model.topTubeEnd.x,
			cy: model.topTubeEnd.y,
			r: 1,
			fill: ALT_COLOR,
		}),
		svg("circle", {
			cx: model.pan.x,
			cy: model.pan.y,
			r: 4,
			fill: ALT_COLOR,
		}),
		withDefault(undefined,
			drawGuide(model)(model.guide)
		),
	]),
	model => {
		let zoom = multiply(model.zoom)
		let panzoom = {
			x: compose(round, add(model.pan.x), zoom),
			y: compose(round, add(model.pan.y), zoom),
		}

		return mapProps({
			thickness: zoom,
			pan: panzoom,
			frontHub: panzoom,
			rearHub: panzoom,
			headTubeProjection: panzoom,
			headTubeStart: panzoom,
			headTubeEnd: panzoom,
			forkStart: panzoom,
			topTubeStart: panzoom,
			bottomTubeStart: panzoom,
			topTubeEnd: panzoom,
			seatTubeEnd: panzoom,
			bb: panzoom,
			bbProjection: panzoom,
		}, model)
	}
)

const unit = (long, short) => ({long, short})

// renderModel :: Model -> Model -> IO something
const updateModelAndRender = oldmodel => compose(
	//IO something /*TODO what is something?*/
	chain(domPatch("#root")),
	//IO Diff
	map(d => domDiff(createTree(oldmodel))(d)), //not preloading to avoid infinite loop
	//IO VTree
	map(createTree),
	//IO Model
	setModel
)

// setPath2 :: [String|Number] -> Obj -> a -> Obj
const setPath2 = (a, b) => c => setPath(a, c, b)

// updateForSetPath :: ([String|Number], Model) -> a -> Model
const updateForSetPath = (attrpath, model) => compose(
	setPath2(attrpath, model)
)

// updateForAddNewTab :: Model -> () -> Model
const updateForAddingNewTab = model => compose(
	setPath(["currentTabIndex"], model.myBikes.length),
	setPath([
		"myBikes",
		model.myBikes.length,
	],
		model.myBikes[model.currentTabIndex]
	),
	() => model
)

// (Model, [String|Number]) -> a -> Maybe b
const fromArrayAt = (model, list) => compose(
	flip(path)(model),
	flip(concat)(list),
	Array.of
)

// updateForChangingTabs :: Model -> Number -> Model
const updateForChangingTabs = model => compose(
	withDefault({}),
	merge(liftA2(assign)),
	fanout(
		compose(
			Maybe.of,
			setPath2(["currentTabIndex"], model)
		),
		fromArrayAt(model, ["myBikes"]) //Bike
	)
)

// updateForChangingTemplates :: Model -> Number -> Model
const updateForChangingTemplates = model => compose(
	setPath(["isDirty"], false),
	setPath2(["myBikes", model.currentTabIndex], model),
	withDefault({}),
	merge(liftA2(assign)),
	fanout(
		compose(
			Maybe.of,
			objOf("template")
		),
		fromArrayAt(model, ["allBikes", "list"])
	)
)

// showTabs :: String -> [BikeModel] -> VTree
const showTabs = (name, activeTabIndex, {ontabadd, ontabchange}) => compose(
	x => h(name, x),
	concat([
		h("span .tabButton", {
			onclick: ontabadd,
		}, ["+"]),
	]),
	map(x => h(`span .tabButton ${x.index == activeTabIndex ? ".active" : ""}`, {
		style: { color: x.color },
		title: x.name,
		onclick: () => ontabchange(x.index),
	}, `•${x.index}`)),
	merge(mergeListsBy(assign)),
	fanout(
		compose(
			map(objOf("index")),
			map(parseInt),
			Object.keys
		),
		identity
	)
)

// createInputsTree :: Model -> VTree
const createInputsTree = model => compose(
	x => h("div .inputs .tabbedPanel", x),
	cons(
		showTabs("div .tabs", model.currentTabIndex, {
			ontabadd: compose(
				run,
				updateModelAndRender(model),
				updateForAddingNewTab(model)
			),
			ontabchange: compose(
				run,
				updateModelAndRender(model),
				updateForChangingTabs(model)
			),
		})(model.myBikes)
	),
	Array.of,
	x => h("div .panel", x),
	flip(concat)([
		h("div .templates .zebra", [
			h("div .title", "Template"),
			h("select", {
				disabled: model.allBikes.status == "busy",
				onchange: compose(
					map(run),
					map(updateModelAndRender(model)),
					map(updateForChangingTemplates(model)),
					chain(
						(model.isDirty && model.showDirtyConfirmation) ?
							showConfirmDialog("You will lose changes made to this bike.\nAre you sure?") :
							Maybe.Just
					),
					chain(parseFloatSafe),
					path(["target", "value"])
				),
			}, cons(
				model.template === "custom" ?
					h("option", {
						value: "custom",
						selected: "selected",
						disabled: true,
					}, "custom") :
					undefined,
				model.allBikes.list.map((x, i) => h("option", {
					value: i,
					selected: model.template === i && "selected",
				}, x.name))
			)),
			(model.allBikes.status != "done" ?
				h("span", {
					title: model.allBikes.status,
				}, "⌛") :
				undefined
			),
			h("p", "template " + model.template),
			h("p", "isDirty " + model.isDirty),
		]),
	]),
	concat([
		h("div", {
			style: {
				"line-height": "2em",
				"text-align": "center",
				"font-size": "0.9em",
				"cursor": "pointer",
			},
		}, [
			h("span", {
				onclick: compose(
					run,
					updateModelAndRender(model),
					updateForSetPath(["areExtrasShown"], model),
					() => !model.areExtrasShown
				),
				style: {
					"text-decoration": "underline",
				},
			}, [
				model.areExtrasShown ? "hide extras" : "extras",
			]),
		]),
		h("div .inputContainer .zebra", [
			h("label", {}, "color"),
			h("select",
				{
					onchange: compose(
						map(run),
						map(updateModelAndRender(model)),
						map(updateForSetPath(["myBikes", model.currentTabIndex, "fillColor"], model)),
						path(["target", "value"])
					),
				},
				COLORS.map(c => h("option", {
					value: c.code,
				}, c.name))
			),
		]),
	]),
	map(x => h("div .inputContainer .zebra", [
		h("label", {}, (x.label || x.path.join(" "))),
		h("input", {
			type: "number",
			step: 0.1,
			value: x.formatForHumans(withDefault(0, path(x.path, model))),
			readonly: x.readonly,
			onfocus: compose(
				map(run),
				map(updateModelAndRender(model)),
				map(updateForSetPath(["guide"], model)),
				//Maybe Guide
				() => safe(identity, x.guide)
				//undefined | Guide
			),
			onchange: compose(
				map(run),
				//Maybe IO
				map(updateModelAndRender(model)),
				map(setPath(["myBikes", model.currentTabIndex, "template"], "custom")),
				map(setPath(["isDirty"], true)),
				map(updateForSetPath(["myBikes", model.currentTabIndex].concat(x.path), model)),
				//Maybe a
				chain(x.formatForCalculations),
				//Maybe Float
				chain(parseFloatSafe),
				//Maybe String
				path(["target", "value"])
			),
		}),
		h("span.unit", {
			title: x.unit.long,
		}, x.unit.short),
	])),
	//List Obj
	filter(x => !x.isExtra || model.areExtrasShown)
	//List Obj
)([
	{
		path: ["wheelbaseLen"],
		label: "wheelbase",
		formatForHumans: round,
		formatForCalculations: safe(lt(
			model.chainstayLen +
			model.topTubeLen +
			model.forkLen +
			model.headTubeLen
		)), //TODO improve validation
		guide: lineThroughPoints(["frontHub", "rearHub"]),
		unit: unit("milimeters", "mm"),
	},
	{
		path: ["topTubeLen"],
		label: "top tube",
		formatForHumans: round,
		formatForCalculations: safe(gt(0)),
		guide: lineThroughPoints(["topTubeStart", "topTubeEnd"]),
		readonly: true,
		unit: unit("milimeters", "mm"),
	},
	{
		path: ["forkLen"],
		label: "fork",
		formatForHumans: identity,
		formatForCalculations: safe(gt(4 * model.forkOffset)),
		guide: lineThroughPoints(["frontHub", "forkStart"]),
		unit: unit("milimeters", "mm"),
	},
	{
		path: ["forkOffset"],
		label: "fork offset",
		formatForHumans: identity,
		formatForCalculations: safe(gt(0)),
		guide: lineThroughPoints(["frontHub", "headTubeProjection"]),
		unit: unit("milimeters", "mm"),
	},
	{
		path: ["headTubeLen"],
		label: "head tube",
		formatForHumans: identity,
		formatForCalculations: safe(gt(model.bottomTubeOffset)),
		guide: lineThroughPoints(["topTubeStart", "topTubeEnd"]),
		unit: unit("milimeters", "mm"),
	},
	{
		path: ["headTubeAngle"],
		label: "head tube angle",
		formatForHumans: compose(
			round,
			toDegrees,
			add(-Math.PI)
		),
		formatForCalculations: compose(
			map(add(Math.PI)),
			map(toRadians),
			chain(safe(lt(90))),
			safe(gt(0))
		),
		guide: lineThroughPoints(["rearHub", "headTubeProjection", "headTubeEnd"]),
		unit: unit("degrees", "°"),
	},
	{
		path: ["seatTubeLen"],
		label: "seat tube",
		formatForHumans: identity,
		formatForCalculations: Maybe.Just,
		guide: lineThroughPoints(["bb", "topTubeEnd"]),
		unit: unit("milimeters", "mm"),
	},
	{
		path: ["seatTubeAngle"],
		label: "seat tube angle",
		formatForHumans: compose(
			round,
			toDegrees,
			add(-Math.PI)
		),
		formatForCalculations: compose(
			map(add(Math.PI)),
			map(toRadians),
			chain(safe(lt(90))),
			safe(gt(0))
		),
		unit: unit("degrees", "°"),
	},
	{
		path: ["chainstayLen"],
		label: "chainstay",
		formatForHumans: round,
		formatForCalculations: Maybe.Just,
		guide: lineThroughPoints(["bb", "rearHub"]),
		unit: unit("milimeters", "mm"),
	},
	{
		path: ["bbDropLen"],
		label: "bb drop",
		formatForHumans: round,
		formatForCalculations: Maybe.Just,
		guide: lineFromPointToReferenceLine("bb", "x", "rearHub"),
		unit: unit("milimeters", "mm"),
	},
	{
		path: ["reachLen"],
		label: "reach",
		formatForHumans: round,
		formatForCalculations: Maybe.Just,
		guide: lineFromPointToReferenceLine("bb", "y", "headTubeEnd"), 
		unit: unit("milimeters", "mm"),
	},
	{
		path: ["stackLen"],
		label: "stack",
		formatForHumans: round,
		formatForCalculations: Maybe.Just,
		guide: lineFromPointToReferenceLine("bb", "x", "headTubeEnd"), 
		unit: unit("milimeters", "mm"),
	},
	{
		path: ["crownHeight"],
		label: "crown height",
		formatForHumans: round,
		formatForCalculations: Maybe.Nothing,
		guide: lineThroughPoints(["headTubeStart", "forkStart"]),
		readonly: true,
		unit: unit("milimeters", "mm"),
		isExtra: true,
	},
	{
		path: ["seatTubeExtra"],
		label: "seat tube padding",
		formatForHumans: identity,
		formatForCalculations: safe(gt(model.thickness)),
		guide: lineThroughPoints(["seatTubeEnd", "topTubeEnd"]),
		unit: unit("milimeters", "mm"),
		isExtra: true,
	},
	{
		path: ["topTubeOffset"],
		label: "top tube offset in head tube",
		formatForHumans: identity,
		formatForCalculations: safe(gt(0)),
		guide: lineThroughPoints(["topTubeStart", "headTubeEnd"]),
		unit: unit("milimeters", "mm"),
		isExtra: true,
	},
])

// createTree :: Model -> VTree
const createTree = compose(
	model => h("div#root .container", [
		createInputsTree(model),
		createBicycleSvg(model),
	]),
	flip(reduce((x, f) => f(x))) ([
		x => assign({
			bb: point(x.pan.x, x.pan.y),
			bottomTubeOffset: x.headTubeLen * 0.7,
		}, x),
		x => assign({
			headTubeEnd: addPoints(x.bb, point(x.reachLen, -x.stackLen)),
			seatTubeEnd: addPoints(x.bb, avector(x.seatTubeLen + x.seatTubeExtra, x.seatTubeAngle)),
			topTubeEnd: addPoints(x.bb, avector(x.seatTubeLen, x.seatTubeAngle)),
			rearHub: subPoints(
				x.bb,
				point(
					x.chainstayLen * Math.cos(Math.asin(x.bbDropLen / x.chainstayLen)),
					x.bbDropLen
				)
			),
			forkAngle: x.headTubeAngle - Math.asin(x.forkOffset / x.forkLen),
			//TODO why minus?
		}, x),
		x => assign({
			frontHub: addPoints(x.rearHub, point(x.wheelbaseLen, 0)),
			headTubeStart: addPoints(x.headTubeEnd, avector(x.headTubeLen, x.headTubeAngle + Math.PI)),
		}, x),
		x => assign({
			forkStart: addPoints(x.frontHub, avector(x.forkLen, x.forkAngle)),
			headTubeProjection: addPoints(x.frontHub, point(x.forkOffset / Math.sin(x.headTubeAngle), 0)),
		}, x),
		x => assign({
			topTubeStart: addPoints(x.headTubeStart, avector(x.headTubeLen - x.topTubeOffset, x.headTubeAngle)),
			bottomTubeStart: addPoints(x.headTubeStart, avector(x.headTubeLen - x.bottomTubeOffset, x.headTubeAngle)),
		}, x),
		x => assign({
			crownHeight: vectorLen(subPoints(x.forkStart, x.headTubeStart)),
			topTubeLen: vectorLen(subPoints(x.topTubeStart, x.topTubeEnd)),
		}, x),
	]),
	merge(assign),
	fanout(
		x => x.myBikes[x.currentTabIndex],
		identity
	)
)

/*
 *
 * RUN
 *
 */

// setAllBikes :: (Model, BikeModel) -> ()
const setAllBikes = curry((model, bikes) => compose(
	x => x.fork(
		print("ERROR"),
		() => {}
	),
	map(run), //UNSAFE
	map(updateModelAndRender(model)),
	map(updateForSetPath(["allBikes"], model)),
	map(assign({status: "done"})),
	map(objOf("list")),
	map(map(mapProps({
		headTubeAngle: compose(add(Math.PI), toRadians),
		seatTubeAngle: compose(add(Math.PI), toRadians),
		fillColor: COLORS[0].code,
	})))
)(bikes))

compose(
	map(run),
	x => x.toArray(),
	fanout(
		map(flip(setAllBikes)(listBikes())),
		compose(
			chain(x => replaceDomWith("#root", x)),
			map(vdomCreate),
			map(createTree)
		)
	),
	setModel
)({
	myBikes: [{
		bbDropLen: 78,
		chainstayLen: 460,
		forkLen: 390,
		forkOffset: 45,
		headTubeLen: 152,
		headTubeAngle: Math.PI + toRadians(+72),
		topTubeOffset: 30,
		topTubeLen: 564.5,
		topTubeAngle: toRadians(0),
		seatTubeLen: 560,
		seatTubeExtra: 20,
		seatTubeAngle: Math.PI + toRadians(+73),
		wheelbaseLen: 1055.6,
		stackLen: 588,
		reachLen: 389.3,
		thickness: 15,
		fillColor: COLORS[0].code,
		template: "custom",
	}],
	allBikes: {
		status: "busy",
		list: [],
	},
	currentTabIndex: 0,
	zoom: 0.5,
	pan: point(200, 300),
	guide: lineThroughPoints([]),
	isDirty: false,
	showDirtyConfirmation: true,
})

inspect("inspecting", Maybe.Just(3))
