// Virtual DOM
import vdomCreate from "virtual-dom/create-element"
import vdomDiff from "virtual-dom/diff"
import h from "virtual-dom/h"
import vdomPatch from "virtual-dom/patch"
// Algebraic types
import IO from "crocks/IO"
import Maybe from "crocks/Maybe"
// Helpers
import assign from "crocks/helpers/assign"
import branch from "crocks/Pair/branch"
import bimap from "crocks/pointfree/bimap"
import chain from "crocks/pointfree/chain"
import compose from "crocks/helpers/compose"
import cons from "crocks/pointfree/cons"
import curry from "crocks/helpers/curry"
import identity from "crocks/combinators/identity"
import fanout from "crocks/helpers/fanout"
import head from "crocks/pointfree/head"
import liftA2 from "crocks/helpers/liftA2"
import map from "crocks/pointfree/map"
import mapProps from "crocks/helpers/mapProps"
import merge from "crocks/pointfree/merge"
import objOf from "crocks/helpers/objOf"
import omit from "crocks/helpers/omit"
import path from "crocks/Maybe/propPath"
import pick from "crocks/helpers/pick"
import propEq from "crocks/predicates/propEq"
import run from "crocks/pointfree/run"
import safe from "crocks/Maybe/safe"
import setPath from "crocks/helpers/setPath"
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

const COLORS = {
	black: "black",
	blue: "#228",
	red: "#a42",
}

const TEMPLATE_FIELDS = [
	"bbDropLen",
	"chainstayLen",
	"forkLen",
	"forkOffset",
	"headTubeLen",
	"headTubeAngle",
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

// print :: String -> a -> a
const print = prefix => tap(x => console.log(prefix, x))

// inspect :: String -> a -> a
const inspect = prefix => tap(x => console.log(prefix + " " + x.inspect()))

/*
 * Mathematical Operations */

// add :: Number -> Number -> Number
const add = curry((a, b) => a + b)
// multiply :: Number -> Number -> Number
const multiply = curry((a, b) => a * b)

const pow = b => a => Math.pow(a, b)
const pow2 = pow(2)

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
 * Array, Object Operations */

// join :: String -> [String] -> String
const join = t => l => l.join(t)

// spaced :: [String] -> String
const spaced = join(" ")

// putIndexes :: [{}] -> [{index: Number}]
const putIndexes = list =>
	list.map((x, i) => assign({index: i}, x))

// changePath :: [String|Number] -> (a -> b) -> Object -> Maybe Object
const changePath = curry((dest, f, O) =>compose(
	map(setPath2(dest, O)),
	map(f),
	path(dest)
)(O))

// removeFromArray :: (Number, [a]) -> [a]
const removeFromArray = curry((pos, array) => [
	...array.slice(0, pos),
	...array.slice(pos + 1),
])

/*
 * Other Operations */

const Point = (x, y) => ({x, y})
const Vector = (l, a) => Point(l * Math.cos(a), l * Math.sin(a))

Point.add = (p1, p2) => Point(p1.x + p2.x, p1.y + p2.y)

Point.subtract = (p1, p2) => Point(p1.x - p2.x, p1.y - p2.y)

Point.multiply = (k, p) => Point(p.x * k, p.y * k)

Point.dot = (p1, p2) => (p1.x*p2.x + p1.y*p2.y)

Point.cross = (p1, p2) => (p1.x*p2.y - p1.y*p2.x)

Point.len = p => Math.sqrt(pow2(p.x) + pow2(p.y))

Point.unit = p => Point.multiply(1 / Point.len(p), p)

Point.isNaN = p => Number.isNaN(p.x) || Number.isNaN(p.y)

// Unit :: (String, String) -> Unit
const Unit = (long, short) => ({long, short})

// setPath2 :: [String|Number] -> Obj -> a -> Obj
const setPath2 = (a, b) => c => setPath(a, c, b)

// showConfirmDialog :: String -> a -> Maybe a
const showConfirmDialog = text => a => window.confirm(text) ?
	Maybe.Just(a) :
	Maybe.Nothing(a)

/*
 * Data Transformations Within Model
 */

// bikeToTemplate :: Bike -> Template
const bikeToTemplate = pick(TEMPLATE_FIELDS)
// templateToBike :: Template -> Bike
const templateToBike = pick(["fillColor", ...TEMPLATE_FIELDS])

// rawTemplateToTemplate :: RawTemplate -> Template
const rawTemplateToTemplate = compose(
	assign({
		fillColor: COLORS.black,
	}),
	mapProps({
		headTubeAngle: compose(add(Math.PI), toRadians),
		seatTubeAngle: compose(add(Math.PI), toRadians),
	})
)

// templateToRawTemplate :: Template -> RawTemplate
const templateToRawTemplate  = mapProps({
	headTubeAngle: compose(toDegrees, add(-Math.PI)),
	seatTubeAngle: compose(toDegrees, add(-Math.PI)),
})

/*
 * SVG Operations
 */

const svgdp = op => p => `${op}${round(p.x)} ${round(p.y)}`

const svgpath = curry((style, d) => svg("path", ({
	d: d,
	"stroke-dasharray": style == "dashed" ? "3 5" : undefined,
	//deneme: style,
})))

// buildPath :: LineDef -> String
const buildPath = compose(
	withDefault(undefined),
	map(spaced),
	merge(liftA2(cons)),
	bimap(map(svgdp("M")), map(map(svgdp("L")))),
	fanout(head, tail)
)

const buildPathWithStyle = ({style, list}) => svgpath(style, buildPath(list))

// svgTrapezoid :: (Point, Point, Number, Number || undefined) -> svg.Path
const svgTrapezoid = (p0, p1, w1, w2) => {
	let v1 = Vector(w1, Math.atan2(p1.x - p0.x, p0.y - p1.y))
	let v2 = Vector(w2 || w1, Math.atan2(p1.x - p0.x, p0.y - p1.y))

	return buildPathWithStyle({
		style: "straight",
		list: [
			p0, 
			Point.add(p0, v1),
			Point.add(p1, v2),
			Point.subtract(p1, v2),
			Point.subtract(p0, v1),
		],
	})
}

// drawGuide :: Model -> [Model -> [Point]] -> Svg.g
const drawGuide = model => compose(
	x => svg("g", {
		stroke: model.fillColor != COLORS.red ? "red" : COLORS.black,
		fill: "none",
	}, x),
	map(buildPathWithStyle),
	map(mapProps({
		list: f => f(model),
	}))
)

const guide = (style, list) => ({style, list})

// guideBetweenPoints :: [(Object -> Point)] -> (Object -> [Point])
const guideBetweenPoints = fs => obj => map(f => f(obj), fs)

const projectionOnLineFromPoint = (l1, l2, p) => {
	let u12 = Point.unit(Point.subtract(l2, l1))
	let k = Point.dot(u12, Point.subtract(p, l1))
	
	return Point.add(
		l1,
		Point.multiply(k, u12)
	)
}

// render :: Model -> VTree
const createBicycleSvg = compose(
	model => svg("svg", {
		style: {
			fill: model.fillColor,
		},
		viewBox: "0 0 700 400",
	}, [
		// top tube
		svgTrapezoid(model.topTubeEnd, model.topTubeStart, model.thickness),
		// bottom tube
		svgTrapezoid(model.bb, model.bottomTubeStart, model.thickness),
		// seat tube
		svgTrapezoid(model.bb, model.seatTubeEnd, model.thickness),
		// chainstay
		svgTrapezoid(model.bb, model.rearHub, 1 * model.thickness, 0.5 * model.thickness),
		// head tube
		svgTrapezoid(model.headTubeStart, model.headTubeEnd, 1.2 * model.thickness),
		// seat stay
		svgTrapezoid(model.rearHub, model.topTubeEnd, 0.6 * model.thickness, 0.6 * model.thickness),
		// fork crown
		svgTrapezoid(model.headTubeStart, model.forkStart, 1.2 * model.thickness + 2),
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
		drawGuide(model)(model.guide),
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
		}, model)
	}
)

// updateModelAndRender :: Model -> Model -> IO something
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

// composeUpdate :: (Model, *Function) -> IO Function
const composeUpdateSafe = model => (...fs) => compose(
	map(run),
	map(updateModelAndRender(model)),
	...fs
)
const composeUpdate = model => (...fs) =>
	composeUpdateSafe(model)(Maybe.Just, ...fs)

// updateForAddNewTab :: Model -> () -> Model
const updateForAddingNewTab = model => composeUpdate(model)(
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
const updateForChangingTabs = model => composeUpdate(model)(
	setPath2(["currentTabIndex"], model)
)

// updateForRemovingTabs :: Model -> Number -> Model
const updateForRemovingTabs = model => composeUpdateSafe(model)(
	map(setPath(["currentTabIndex"], 0)),
	map(setPath2(["myBikes"], model)),
	merge(liftA2(removeFromArray)),
	map(() => path(["myBikes"], model)),
	branch,
	safe(x => x < model.myBikes.length)
)

// updateForChangingTemplates :: Model -> Number -> Model
const updateForChangingTemplates = model => composeUpdateSafe(model)(
	map(setPath2(["myBikes", model.currentTabIndex], model)),
	num => path(["templates", "list", num], model)
		.map(templateToBike)
		.map(assign({
			isDirty: false,
			template: num,
		}))
)

const updateForStartingTemplateRename = model => composeUpdateSafe(model)(
	() => changePath(["myBikes", model.currentTabIndex], assign({
			newTemplateName: "unnamed bike",
			isInEdit: true,
	}), model)
)

const updateForFinishingTemplateRename = model => composeUpdateSafe(model)(
	chain(changePath(["myBikes", model.currentTabIndex], assign({
		isDirty: false,
		template: model.templates.list.length,
		isInEdit: false,
	}))),
	chain(tpl => changePath(["templates", "list"], tpls => [
		...tpls,
		tpl,
	], model)),
	map(bike => compose(
		assign({name: bike.newTemplateName}),
		bikeToTemplate
	)(bike)),
	chain(path(["myBikes", model.currentTabIndex])),
	() => safe(m => m.templates.list.find(x => x.name == model.newTemplateName) === undefined, model)
)


const updateForSavingTemplate = model => composeUpdateSafe(model)(
	map(() => setPath(["templates", "status"], "busy", model)),
	map(x => x.fork(
		print(window.alert),
		print("saved")
	)),
	map(map(tpl => {
		let model_ = getModel()
		let i = model_.templates.list.findIndex(propEq("name", tpl.name))

		return ((i >= 0)
			?  Maybe.Just(
				setPath(["templates", "list", i], tpl, model_)
			)
			: Maybe.Nothing()
		)
			.map(setPath(["templates", "status"], "done"))
			.map(updateModelAndRender(model_))
			.map(run)
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
	chain(num => path(["templates", "list", num], model)),
	chain(safe(Number.isInteger)),
	() => path(["myBikes", model.currentTabIndex, "template"], model)
)


// createTabButtons :: (String, Number, Object) -> [BikeModel] -> VTree
const createTabButtons = (tagname, activeTabIndex, {ontabadd, ontabchange}, templates) =>
	h(tagname, {}, [
		h("span .realTabs", {},
			putIndexes(templates)
				.map(x => h(`span .clickable .button ${x.index == activeTabIndex ? ".active" : ""}`, {
					style: { color: x.color },
					title: x.name,
					onclick: () => ontabchange(x.index),
				}, `•${x.index}`))
		),
		h("span .clickable .button", {
			onclick: ontabadd,
			title: "add new bike",
		}, "+"),
	])

// createInputsTree :: Model -> VTree
const createInputsTree = model => {
	let curbike = model.myBikes[model.currentTabIndex]

	return h("div .inputs .tabbedPanel", [
		createTabButtons("div .tabs", model.currentTabIndex, {
			ontabadd: updateForAddingNewTab(model),
			ontabchange: updateForChangingTabs(model),
		}, model.myBikes),

		h("div .panel", [
			h("div .templates .zebra", [
				model.myBikes.length > 1
					? h("span .NEcorner .clickable .button", {
						title: "remove bike",
						onclick: compose(
							updateForRemovingTabs(model),
							() => model.currentTabIndex
						),
					}, "✕")
					: undefined,

				h("div .title", "Template"),

				h("span .editable", curbike.isInEdit === true
					? [
						h("input .hoverable", {
							value: curbike.newTemplateName,
							onfocus: function() {
								this.select(); //ughhh... :/
							},
							onchange: composeUpdateSafe(model)(
								map(setPath2(["myBikes", model.currentTabIndex, "newTemplateName"], model)),
								path(["target", "value"])
							),
						}),
						h("span .clickable .button", {
							onclick: updateForFinishingTemplateRename(model),
						}, "✓"),
						h("span .clickable .button", {
							onclick: composeUpdate(model)(
								setPath2(["myBikes", model.currentTabIndex, "isInEdit"], model),
								() => false
							),
						}, "✕"),
					]
					: [
						h("select .clickable .button",
							{
								disabled: model.templates.status == "busy",
								onchange: compose(
									chain(updateForChangingTemplates(model)),
									chain(parseFloatSafe),
									path(["target", "value"])
								),
							}, [
								curbike.template == "custom"
									?  h("option", {
										value: "custom",
										selected: "selected",
										disabled: true,
									}, "custom")
									: undefined,
								...putIndexes(model.templates.list)
									.map(x => h("option", {
										value: x.index,
										selected: curbike.template == x.index && "selected",
									}, x.name)),
							]
						),
						(curbike.isDirty && curbike.template == "custom")
							?  h("span .clickable .button", {
								title: "give this frame a name",
								onclick: updateForStartingTemplateRename(model),
							}, "✎")
							: undefined,
						model.templates.status != "done"
							?  h("img .icon", {
								src: "/spinner.gif",
								title: model.templates.status,
							})
							: undefined,
						(Number.isInteger(curbike.template) && model.templates.list[curbike.template]._id === undefined)
							? h("span .clickable .button", {
								onclick: updateForSavingTemplate(model),
							}, "⇅")
							: undefined,
					]
				),
			]),

			...[
				{
					path: ["wheelbaseLen"],
					label: "wheelbase",
					formatForHumans: round,
					formatForCalculations: identity,
					guide: [
						guide("straight", guideBetweenPoints([
							x => x.frontHub,
							x => x.rearHub,
						])),
					],
					unit: Unit("milimeters", "mm"),
				},
				{
					path: ["topTubeLen"],
					label: "top tube",
					formatForHumans: round,
					formatForCalculations: identity,
					guide: [
						guide("straight", guideBetweenPoints([
							x => x.topTubeStart,
							x => x.topTubeEnd,
						])),
					],
					unit: Unit("milimeters", "mm"),
				},
				{
					path: ["headTubeLen"],
					label: "head tube",
					formatForHumans: round,
					formatForCalculations: identity,
					guide: [
						guide("straight", guideBetweenPoints([
							x => x.headTubeStart,
							x => x.headTubeEnd,
						])),
					],
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
						add(Math.PI),
						toRadians
					),
					guide: [
						guide("straight", guideBetweenPoints([
							x => x.rearHub,
							x => x.headTubeProjection,
							x => x.headTubeEnd,
						])),
					],
					unit: Unit("degrees", "°"),
				},
				{
					path: ["seatTubeLen"],
					label: "seat tube",
					formatForHumans: identity,
					formatForCalculations: identity,
					guide: [
						guide("straight", guideBetweenPoints([
							x => x.bb,
							x => x.topTubeEnd,
						])),
					],
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
						add(Math.PI),
						toRadians
					),
					guide: [
						guide("straight", guideBetweenPoints([
							x => x.seatTubeEnd,
							x => x.bb,
							x => Point.subtract(x.bb, Point(x.seatTubeLen, 0)),
						])),
					],
					unit: Unit("degrees", "°"),
				},
				{
					path: ["chainstayLen"],
					label: "chainstay",
					formatForHumans: round,
					formatForCalculations: identity,
					guide: [
						guide("straight", guideBetweenPoints([
							x => x.bb,
							x => x.rearHub,
						])),
					],
					unit: Unit("milimeters", "mm"),
				},
				{
					path: ["bbDropLen"],
					label: "bb drop",
					formatForHumans: round,
					formatForCalculations: identity,
					guide: [
						guide("straight", guideBetweenPoints([
							x => x.bb,
							x => Point(x.bb.x, x.rearHub.y),
						])),
						guide("dashed", guideBetweenPoints([
							x => x.rearHub,
							x => x.frontHub,
						])),
					],
					unit: Unit("milimeters", "mm"),
				},
				{
					path: ["reachLen"],
					label: "reach",
					formatForHumans: round,
					formatForCalculations: identity,
					guide: [
						guide("straight", guideBetweenPoints([
							x => x.bb,
							x => Point(x.headTubeEnd.x, x.bb.y),
						])),
						guide("dashed", guideBetweenPoints([
							x => x.headTubeEnd,
							x => Point(x.headTubeEnd.x, x.bb.y + 20),
						])),
					],
					unit: Unit("milimeters", "mm"),
				},
				{
					path: ["stackLen"],
					label: "stack",
					formatForHumans: round,
					formatForCalculations: identity,
					guide: [
						guide("straight", guideBetweenPoints([
							x => x.bb,
							x => Point(x.bb.x, x.headTubeEnd.y),
						])),
						guide("dashed", guideBetweenPoints([
							x => x.headTubeEnd,
							x => Point(x.bb.x - 20, x.headTubeEnd.y),
						])),
					], 
					unit: Unit("milimeters", "mm"),
				},
				{
					path: ["forkOffset"],
					label: "fork offset",
					formatForHumans: round,
					formatForCalculations: identity,
					guide: [
						guide("straight", guideBetweenPoints([
							x => x.frontHub,
							x => projectionOnLineFromPoint(
								x.headTubeStart,
								x.headTubeEnd,
								x.frontHub
							),
						])),
						guide("dashed", guideBetweenPoints([
							x => x.headTubeEnd,
							x => projectionOnLineFromPoint(
								x.headTubeStart,
								x.headTubeEnd,
								x.frontHub
							),
						])),
					],
					readonly: true,
					unit: Unit("milimeters", "mm"),
				},
				{
					path: ["forkLen"],
					label: "fork",
					formatForHumans: identity,
					formatForCalculations: identity,
					guide: [
						guide("straight", guideBetweenPoints([
							x => x.frontHub,
							x => x.forkStart,
						])),
					],
					unit: Unit("milimeters", "mm"),
				},
				{
					path: ["crownHeight"],
					label: "crown height",
					formatForHumans: round,
					formatForCalculations: identity,
					guide: [
						guide("straight", guideBetweenPoints([
							x => x.headTubeStart,
							x => x.forkStart,
						])),
					],
					readonly: true,
					unit: Unit("milimeters", "mm"),
					isExtra: true,
				},
				{
					path: ["seatTubeExtra"],
					label: "seat tube padding",
					formatForHumans: identity,
					formatForCalculations: identity,
					guide: [
						guide("straight", guideBetweenPoints([
							x => x.seatTubeEnd,
							x => x.topTubeEnd,
						])),
					],
					unit: Unit("milimeters", "mm"),
					isExtra: true,
				},
				{
					path: ["thickness"],
					label: "tube thickness",
					formatForHumans: multiply(2),
					formatForCalculations: multiply(0.5),
					unit: Unit("milimeters", "mm"),
					step: 1.0,
					isExtra: true,
				},
			]
				.filter(x => !x.isExtra || model.areExtrasShown)
				.map(x =>
					h("div .inputContainer .zebra", [
						h("label", {}, (x.label || x.path.join(" "))),
						h("input .hoverable", {
							type: "number",
							step: x.step || 0.1,
							value: x.formatForHumans(withDefault(0, path(x.path, curbike))),
							readOnly: x.readonly ? "readonly" : undefined,
							onfocus: composeUpdate(model)(
								() => setPath(["guide"], x.guide || [], model),
								() => null
							),
							onchange: composeUpdateSafe(model)(
								map(setPath(["myBikes", model.currentTabIndex, "isDirty"], true)),
								map(setPath(["myBikes", model.currentTabIndex, "template"], "custom")),
								map(setPath2(["myBikes", model.currentTabIndex, ...x.path], model)),
								map(x.formatForCalculations),
								chain(parseFloatSafe),
								path(["target", "value"])
							),
						}),
						h("span.unit", {
							title: x.unit.long,
						}, x.unit.short),

						path(["errors", ...(x.path)], curbike)
							.map(err =>
								h("span.error", err)
							)
							.option(undefined),
					])
				),

			h("div .zebra",
				{
					style: {
						"line-height": "2em",
						"text-align": "center",
						"font-size": "0.9em",
						"cursor": "pointer",
					},
				},
				h("span .clickable",
					{
						onclick: composeUpdate(model)(
							setPath2(["areExtrasShown"], model),
							() => !model.areExtrasShown
						),
						style: {
							"text-decoration": "underline",
						},
					}, 
					model.areExtrasShown ? "hide extras" : "extras"
				)
			),
			h("div .inputContainer .zebra", [
				h("label", {}, "color"),
				h("select .clickable",
					{
						onchange: composeUpdateSafe(model)(
							map(setPath2(["myBikes", model.currentTabIndex, "fillColor"], model)),
							path(["target", "value"])
						),
					},
					Object.keys(COLORS).map(color =>
						h("option", {
							value: COLORS[color],
						}, color)
					)
				),
			]),
		]),

		h("div .footer", [
			"Bicycle-Geometry-Illustrator",
			h("a", {
				href: "http://github.com/aecepoglu/bicycle-geometry",
			}, "by aecepoglu"),
		]),
	])
}

const intersectionsOfLineAndCircle = (p1, p2, c, r) => {
	//assert |c,p1| <= r <= |c,p2|
	let k = projectionOnLineFromPoint(p1, p2, c)
	let n = Point.multiply(
		Math.sqrt(pow2(r) - pow2(Point.len(Point.subtract(k, c)))),
		Point.unit(Point.subtract(p2, p1))
	)

	return [
		Point.add(k, n),
		Point.subtract(k, n),
	]
}

const hForCrash = h("div#root", "FATAL ERROR")

// createTree :: Model -> VTree
const createTree = compose(
	withDefault(hForCrash),
	map(model => h("div#root .container", [
		createInputsTree(model),
		createBicycleSvg(assign({
			zoom: model.zoom,
			pan: model.pan,
			guide: model.guide,
		}, model.myBikes[model.currentTabIndex])),
	])),
	model => changePath(["myBikes", model.currentTabIndex], x => {
		let bb = Point(model.pan.x, model.pan.y)

		let rearHub = Point.subtract(
			bb,
			Point(
				x.chainstayLen * Math.cos(Math.asin(x.bbDropLen / x.chainstayLen)),
				x.bbDropLen
			)
		)
		let frontHub = Point.add(rearHub, Point(x.wheelbaseLen, 0))

		let headTubeEnd = Point.add(bb, Point(x.reachLen, -x.stackLen))
		let headTubeStart = Point.add(headTubeEnd, Vector(x.headTubeLen, x.headTubeAngle + Math.PI))

		let seatTubeEnd = Point.add(bb, Vector(x.seatTubeLen + x.seatTubeExtra, x.seatTubeAngle))

		let forkOffsetV = Point.subtract(
			projectionOnLineFromPoint(headTubeStart, headTubeEnd, frontHub),
			frontHub
		)
		let forkOffset = Point.len(forkOffsetV)
			* ((Point.cross(forkOffsetV, Point.subtract(headTubeStart, frontHub))) >= 0
				? 1
				: -1
			)
		let forkStart = intersectionsOfLineAndCircle(headTubeEnd, headTubeStart, frontHub, x.forkLen)[1] //TODO don't hardcode 1

		let topTubeEnd = Point.add(bb, Vector(x.seatTubeLen, x.seatTubeAngle))
		let topTubeStart = intersectionsOfLineAndCircle(headTubeEnd, headTubeStart, topTubeEnd, x.topTubeLen)[0] //TODO don't hardcode 0

		let bottomTubeOffset = x.headTubeLen * 0.7
		let bottomTubeStart = Point.add(headTubeStart, Vector(x.headTubeLen - bottomTubeOffset, x.headTubeAngle))

		let crownHeight = Point.len(Point.subtract(forkStart, headTubeStart))

		let headTubeProjection= Point(
			headTubeEnd.x + ((frontHub.y - headTubeEnd.y) / Math.tan(x.headTubeAngle)),
			frontHub.y
		)

		return assign({
			bb,
			rearHub,
			frontHub,
			headTubeStart,
			headTubeEnd,
			topTubeStart,
			topTubeEnd,
			seatTubeEnd,
			bottomTubeStart,
			headTubeProjection,
			forkStart,
			forkOffset,
			crownHeight,
			errors: {
				topTubeLen: Point.isNaN(topTubeStart) && "too short",
			},
		}, x)
	}, model)
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
		topTubeLen: 550,
		seatTubeLen: 550,
		seatTubeExtra: 20,
		seatTubeAngle: Math.PI + toRadians(+73.5),
		wheelbaseLen: 1011,
		stackLen: 544,
		reachLen: 388,
		thickness: 14,
		fillColor: COLORS.black,
		template: "custom",
		isDirty: false,
	}],
	templates: {
		status: "busy",
		list: [],
	},
	currentTabIndex: 0,
	zoom: 0.5,
	pan: Point(200, 200),
	guide: [],
	showDirtyConfirmation: true,
})

inspect("inspecting", Maybe.Just(3))
