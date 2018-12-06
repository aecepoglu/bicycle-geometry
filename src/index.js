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
import and from "crocks/logic/and"
import assign from "crocks/helpers/assign"
import branch from "crocks/Pair/branch"
import chain from "crocks/pointfree/chain"
import compose from "crocks/helpers/compose"
import concat from "crocks/pointfree/concat"
import cons from "crocks/pointfree/cons"
import curry from "crocks/helpers/curry"
import curryN from "crocks/helpers/nAry"
import identity from "crocks/combinators/identity"
import ifElse from "crocks/logic/ifElse"
import fanout from "crocks/helpers/fanout"
import filter from "crocks/pointfree/filter"
import flip from "crocks/combinators/flip"
import head from "crocks/pointfree/head"
import liftA2 from "crocks/helpers/liftA2"
import listToArray from "crocks/List/listToArray"
import map from "crocks/pointfree/map"
import mapProps from "crocks/helpers/mapProps"
import merge from "crocks/pointfree/merge"
import not from "crocks/logic/not"
import objOf from "crocks/helpers/objOf"
import omit from "crocks/helpers/omit"
import path from "crocks/Maybe/propPath"
import pathEq from "crocks/predicates/propPathEq"
import pathSatisfies from "crocks/predicates/propPathSatisfies"
import pick from "crocks/helpers/pick"
import prop from "crocks/Maybe/prop"
import propEq from "crocks/predicates/propEq"
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
import {listBikes, createBike} from "./db"

import "./style.less"

/*
 * Model Initialization
 */

// Model myModel 
let myModel = new SafeModel()
// getModel :: () -> Model
const getModel = () => myModel.get()
// setModel :: Model -> IO Model
const setModel = x => new IO(() => myModel.set(x))

/*
 * Helpers
 */

const ALT_COLOR = "grey"

const COLORS = [
	{name: "black", code: "black"},
	{name: "blue", code: "#228"},
	{name: "red", code: "#B44"},
]

const TEMPLATE_FIELDS = [
	"bbDropLen",
	"chainstayLen",
	"forkLen",
	"forkOffset",
	"headTubeLen",
	"headTubeAngle",
	"topTubeOffset",
	"topTubeLen",
	"topTubeAngle",
	"seatTubeLen",
	"seatTubeExtra",
	"seatTubeAngle",
	"wheelbaseLen",
	"stackLen",
	"reachLen",
	"thickness",
]

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

/*
 * Mathematical Operations */

// add :: Number -> Number -> Number
const add = curry((a, b) => a + b)
// multiply :: Number -> Number -> Number
const multiply = curry((a, b) => a * b)
// gt :: Number -> Number -> Bool
const gt = b => a => a > b
// lt :: Number -> Number -> Bool
const lt = b => a => a < b

// toRadians :: Degrees -> Radians
const toRadians = multiply(Math.PI / 180)

// toDadians :: Radians -> Degrees
const toDegrees = multiply(180 / Math.PI)

const toFixed = p => x => Math.round(x * p) / p

// round :: Number -> Number
const round = toFixed(10)

// TODO use crocks/Maybe/safe instead
// parseFloatSafe :: String -> Maybe Float
const parseFloatSafe = map(x => Number.isNaN(x) ? Maybe.Nothing() : Maybe.Just(x), parseFloat)

/*
 * Array Operations */

// join :: String -> [String] -> String
const join = t => l => l.join(t)

// append :: a -> [a] -> [a]
const append = a => concat([a])

// (Object, [String|Number]) -> Number -> Maybe a
const fromArrayAt = (model, list) => compose(
	flip(path)(model),
	print(model),
	flip(concat)(list),
	Array.of
)

// spaced :: List String -> String
const spaced = join(" ")

Array.of = x => [x]

/*
 * Other Operations */

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

const Unit = (long, short) => ({long, short})

// setPath2 :: [String|Number] -> Obj -> a -> Obj
const setPath2 = (a, b) => c => setPath(a, c, b)

const inspect = prefix => tap(x => console.log(prefix + " " + x.inspect()))

// mergeListsBy :: ((a, b) -> c) -> ([a], [b]) -> [c]
const mergeListsBy = f => (list1, list2) => list1.map((_, i) => f(list1[i], list2[i]))

// showConfirmDialog :: String -> a -> Maybe a
const showConfirmDialog = text => a => window.confirm(text) ?
	Maybe.Just(a) :
	Maybe.Nothing(a)

// LineDef :: String -> List Point -> LineDef
const LineDef = curry((style, list) => ({style: style, list: list}))

/*
 * SVG Operations */

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

// Guide :: Reader Model -> Maybe List LineDef
// lineThroughPoints :: [String] -> Guide
const lineThroughPoints = compose(
	map(map(map(LineDef("straight")))),
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
		LineDef("straight", List([
			pa,
			assign({ [k]: pa[k] }, pb),
		])),
		LineDef("dashed", List([
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

const slice = (i, count) => as => as.slice(i, count)

// removeFromArray :: (Number, [a]) -> [a]
const removeFromArray = curry((pos, array) => merge(
	concat,
	fanout(
		slice(0, pos),
		slice(pos + 1),
		array
	)
))

// updateForRemovingTabs :: Model -> Number -> Model
const updateForRemovingTabs = model => compose(
	withDefault(model),
	map(setPath(["currentTabIndex"], 0)),
	map(setPath2(["myBikes"], model)),
	merge(liftA2(removeFromArray)),
	map(() => path(["myBikes"], model)),
	branch,
	safe(lt(model.myBikes.length))
)

// updateForChangingTemplates :: Model -> Number -> Model
const updateForChangingTemplates = model => compose(
	setPath2(["myBikes", model.currentTabIndex], model),
	withDefault({}),
	merge(liftA2(assign)),
	fanout(
		compose(
			Maybe.of,
			setPath(["isDirty"], false),
			objOf("template")
		),
		compose(
			map(templateToBike),
			fromArrayAt(model, ["templates", "list"])
		)
	)
)

// putIndexes :: [{}] -> [{index: Number}]
const putIndexes = compose(
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

// showTabs :: String -> [BikeModel] -> VTree
const showTabs = (name, activeTabIndex, {ontabadd, ontabchange}) => compose(
	x => h(name, x),
	concat([
		h("span .clickable .button", {
			onclick: ontabadd,
			title: "add new bike",
		}, "+"),
	]),
	x => [h("span .realTabs", x)],
	map(x => h(`span .clickable .button ${x.index == activeTabIndex ? ".active" : ""}`, {
		style: { color: x.color },
		title: x.name,
		onclick: () => ontabchange(x.index),
	}, [
		`•${x.index}`,
	])),
	putIndexes
)

// hWhen :: (a -> Bool) -> (a -> b) -> a -> (b | undefined)
const hWhen = curryN(3, (a, b, d) => ifElse(a, b, () => undefined, d));

const h_ = (...args) => () => h(...args)

// bikeToTemplate :: Bike -> Template
const bikeToTemplate = pick(TEMPLATE_FIELDS)

// rawTemplateToTemplate :: RawTemplate -> Template
const rawTemplateToTemplate = mapProps({
	headTubeAngle: compose(add(Math.PI), toRadians),
	seatTubeAngle: compose(add(Math.PI), toRadians),
})

const templateToRawTemplate  = mapProps({
	headTubeAngle: compose(toDegrees, add(-Math.PI)),
	seatTubeAngle: compose(toDegrees, add(-Math.PI)),
})

const templateToBike = pick(TEMPLATE_FIELDS)

// appendToPath :: [String|Number] -> a -> Object -> Object
const appendToPath = curry((p, a, o) => compose(
	withDefault(o),
	map(setPath2(p, o)),
	map(append(a)),
	path(p)
)(o))

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
			hWhen(pathSatisfies(["myBikes", "length"], gt(1)), h_("span .NEcorner .clickable .button", {
				title: "remove bike",
				onclick: compose(
					run,
					updateModelAndRender(model),
					updateForRemovingTabs(model),
					() => model.currentTabIndex
				),
			}, "✕"), model),

			h("div .title", "Template"),

			h("span .editable", model.isInEdit === true
				? [
					h("input .hoverable", {
						value: model.newTemplateName,
						onfocus: function() {
							this.select(); //ughhh... :/
						},
						onchange: compose(
							map(run),
							map(updateModelAndRender(model)),
							map(setPath2(["myBikes", model.currentTabIndex, "newTemplateName"], model)),
							path(["target", "value"])
						),
					}),
					h("span .clickable .button", {
						onclick: compose(
							map(run),
							map(updateModelAndRender(model)),
							//Maybe Model'''
							map(setPath(["myBikes", model.currentTabIndex, "isDirty"], false)),
							map(setPath(["myBikes", model.currentTabIndex, "template"], model.templates.list.length)),
							chain(safe(() => model.templates.list.map(x => x.name).includes(model.newTemplateName) !== true)),
							//Maybe Model''
							merge(liftA2(appendToPath(["templates", "list"]))),
							//Pair (Maybe Template) (Maybe Model')
							fanout(
								compose(
									map(setPath(["name"], model.newTemplateName)),
									map(bikeToTemplate),
									path(["myBikes", model.currentTabIndex])
								),
								Maybe.Just
							),
							//Model'
							() => setPath(["myBikes", model.currentTabIndex, "isInEdit"], false, model)
						),
					}, "✓"),
					h("span .clickable .button", {
						onclick: compose(
							run,
							updateModelAndRender(model),
							setPath2(["myBikes", model.currentTabIndex, "isInEdit"], model),
							() => false
						),
					}, "✕"),
				]
				: [
					h("select .clickable .button", {
						disabled: model.templates.status == "busy",
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
					}, concat([
						hWhen(
							propEq("template", "custom"),
							h_("option", {
								value: "custom",
								selected: "selected",
								disabled: true,
							}, "custom"),
							model
						),
					],
						map(x => h("option", {
								value: x.index,
								selected: model.template == x.index && "selected",
							}, x.name),
							putIndexes(model.templates.list)
						)
					)),
					hWhen(
						and(
							propEq("isDirty", true),
							propEq("template", "custom")
						), 
						h_("span .clickable .button", {
							title: "give this frame a name",
							onclick: compose(
								run,
								updateModelAndRender(model),
								setPath(["myBikes", model.currentTabIndex, "newTemplateName"], "unnamed bike"),
								setPath2(["myBikes", model.currentTabIndex, "isInEdit"], model),
								() => true
							),
						}, "✎"),
						model
					),
					hWhen(not(pathEq(["templates", "status"], "done")),
						h_("img .icon", {
							src: "/spinner.gif",
							title: model.templates.status,
						}),
						model
					),
					hWhen(
						x => Number.isInteger(x.template) && x.templates.list[x.template]._id === undefined,
						h_("span .clickable .button", {
							onclick: compose(
								map(run),
								map(updateModelAndRender(model)),
								map(() => setPath(["templates", "status"], "busy", model)),
								map(x => x.fork(
									print(window.alert),
									print("saved")
								)),
								map(map(map(run))),
								map(map(map(updateModelAndRender(model)))),
								map(map(map(setPath(["templates", "status"], "done")))),
								map(map(tpl => {
									//TODO 
									let model_ = getModel()
									let i = model_.templates.list.findIndex(propEq("name", tpl.name))

									if (i < 0) {
										return Maybe.Nothing()
									}

									return Maybe.Just(
										setPath(["templates", "list", i], tpl, model_)
									)
								})),
								map(map(rawTemplateToTemplate)),
								map(createBike),
								map(templateToRawTemplate),
								chain(showConfirmDialog(join("\n")([
									"Publish this bike?",
									"",
									"Publishing it shares it with other users.",
									"",
									"Once published, nobody (including you) can edit/remove it.",
								]))),
								chain(fromArrayAt(model, ["templates", "list"])),
								() => safe(Number.isInteger, model.template)
							),
						}, "⇅"),
						model
					),
				]
			),
		]),
	]),
	concat([
		h("div .zebra", {
			style: {
				"line-height": "2em",
				"text-align": "center",
				"font-size": "0.9em",
				"cursor": "pointer",
			},
		}, [
			h("span .clickable", {
				onclick: compose(
					run,
					updateModelAndRender(model),
					setPath2(["areExtrasShown"], model),
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
			h("select .clickable",
				{
					onchange: compose(
						map(run),
						map(updateModelAndRender(model)),
						map(setPath2(["myBikes", model.currentTabIndex, "fillColor"], model)),
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
		h("input .hoverable", {
			type: "number",
			step: 0.1,
			value: x.formatForHumans(withDefault(0, path(x.path, model))),
			readonly: x.readonly,
			onfocus: compose(
				map(run),
				map(updateModelAndRender(model)),
				map(setPath2(["guide"], model)),
				//Maybe Guide
				() => safe(identity, x.guide)
				//undefined | Guide
			),
			onchange: compose(
				map(run),
				//Maybe IO
				map(updateModelAndRender(model)),
				map(setPath(["myBikes", model.currentTabIndex, "isDirty"], true)),
				map(setPath(["myBikes", model.currentTabIndex, "template"], "custom")),
				map(setPath2(["myBikes", model.currentTabIndex].concat(x.path), model)),
				chain(x.formatForCalculations),
				chain(parseFloatSafe),
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
		unit: Unit("milimeters", "mm"),
	},
	{
		path: ["topTubeLen"],
		label: "top tube",
		formatForHumans: round,
		formatForCalculations: safe(gt(0)),
		guide: lineThroughPoints(["topTubeStart", "topTubeEnd"]),
		readonly: true,
		unit: Unit("milimeters", "mm"),
	},
	{
		path: ["headTubeLen"],
		label: "head tube",
		formatForHumans: identity,
		formatForCalculations: safe(gt(model.bottomTubeOffset)),
		guide: lineThroughPoints(["topTubeStart", "topTubeEnd"]),
		unit: Unit("milimeters", "mm"),
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
		unit: Unit("degrees", "°"),
	},
	{
		path: ["seatTubeLen"],
		label: "seat tube",
		formatForHumans: identity,
		formatForCalculations: Maybe.Just,
		guide: lineThroughPoints(["bb", "topTubeEnd"]),
		unit: Unit("milimeters", "mm"),
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
		unit: Unit("degrees", "°"),
	},
	{
		path: ["chainstayLen"],
		label: "chainstay",
		formatForHumans: round,
		formatForCalculations: Maybe.Just,
		guide: lineThroughPoints(["bb", "rearHub"]),
		unit: Unit("milimeters", "mm"),
	},
	{
		path: ["bbDropLen"],
		label: "bb drop",
		formatForHumans: round,
		formatForCalculations: Maybe.Just,
		guide: lineFromPointToReferenceLine("bb", "x", "rearHub"),
		unit: Unit("milimeters", "mm"),
	},
	{
		path: ["reachLen"],
		label: "reach",
		formatForHumans: round,
		formatForCalculations: Maybe.Just,
		guide: lineFromPointToReferenceLine("bb", "y", "headTubeEnd"), 
		unit: Unit("milimeters", "mm"),
	},
	{
		path: ["stackLen"],
		label: "stack",
		formatForHumans: round,
		formatForCalculations: Maybe.Just,
		guide: lineFromPointToReferenceLine("bb", "x", "headTubeEnd"), 
		unit: Unit("milimeters", "mm"),
	},
	{
		path: ["forkOffset"],
		label: "fork offset",
		formatForHumans: identity,
		formatForCalculations: safe(gt(0)),
		guide: lineThroughPoints(["frontHub", "headTubeProjection"]),
		unit: Unit("milimeters", "mm"),
	},
	{
		path: ["forkLen"],
		label: "fork",
		formatForHumans: identity,
		formatForCalculations: safe(gt(4 * model.forkOffset)),
		guide: lineThroughPoints(["frontHub", "forkStart"]),
		unit: Unit("milimeters", "mm"),
	},
	{
		path: ["crownHeight"],
		label: "crown height",
		formatForHumans: round,
		formatForCalculations: Maybe.Nothing,
		guide: lineThroughPoints(["headTubeStart", "forkStart"]),
		readonly: true,
		unit: Unit("milimeters", "mm"),
		isExtra: true,
	},
	{
		path: ["seatTubeExtra"],
		label: "seat tube padding",
		formatForHumans: identity,
		formatForCalculations: safe(gt(model.thickness)),
		guide: lineThroughPoints(["seatTubeEnd", "topTubeEnd"]),
		unit: Unit("milimeters", "mm"),
		isExtra: true,
	},
	{
		path: ["topTubeOffset"],
		label: "top tube offset in head tube",
		formatForHumans: identity,
		formatForCalculations: safe(gt(0)),
		guide: lineThroughPoints(["topTubeStart", "headTubeEnd"]),
		unit: Unit("milimeters", "mm"),
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

// setTemplates :: (Model, BikeModel) -> ()
const setTemplates = curry((model, bikes) => compose(
	updateModelAndRender(model),
	setPath2(["templates"], model),
	assign({status: "done"}),
	objOf("list"),
	map(rawTemplateToTemplate)
)(bikes))

compose(
	map(run),
	x => x.toArray(),
	fanout(
		compose(
			x => new IO(() => x.fork(
				print("ERROR"),
				() => {}
			)),
			map(run),
			map(y => setTemplates(getModel(), y)), //getModel() explicitly instead of use the piped Model because it may be too old
			listBikes,
			() => undefined
		),
		compose(
			chain(x => replaceDomWith("#root", x)),
			map(vdomCreate),
			map(createTree)
		)
	),
	setModel
)({
	myBikes: [{
		bbDropLen: 75,
		chainstayLen: 435,
		forkLen: 388,
		forkOffset: 48,
		headTubeLen: 114,
		headTubeAngle: Math.PI + toRadians(+73),
		topTubeOffset: 19.8,
		topTubeLen: 550,
		seatTubeLen: 550,
		seatTubeExtra: 20,
		seatTubeAngle: Math.PI + toRadians(+73.5),
		wheelbaseLen: 1011,
		stackLen: 544,
		reachLen: 388,
		thickness: 15,
		fillColor: COLORS[0].code,
		template: "custom",
		isDirty: false,
	}],
	templates: {
		status: "busy",
		list: [],
	},
	currentTabIndex: 0,
	zoom: 0.5,
	pan: point(200, 300),
	guide: lineThroughPoints([]),
	showDirtyConfirmation: true,
})

inspect("inspecting", Maybe.Just(3))
