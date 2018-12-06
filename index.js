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
import bimap from "crocks/pointfree/bimap"
import branch from "crocks/Pair/branch"
import chain from "crocks/pointfree/chain"
import compose from "crocks/helpers/compose"
import constant from "crocks/combinators/constant"
import curry from "crocks/helpers/curry"
import identity from "crocks/combinators/identity"
import either from "crocks/pointfree/either"
import head from "crocks/pointfree/head"
import map from "crocks/pointfree/map"
import maybeToEither from "crocks/Either/maybeToEither"
import merge from "crocks/pointfree/merge"
import propOr from "crocks/helpers/propOr"
import propPathOr from "crocks/helpers/propPathOr"
import setPath from "crocks/helpers/setPath"
import snd from "crocks/Pair/snd"
import tap from "crocks/helpers/tap"

const domPatch = a => b => vdomPatch(a, b)

//const bindingProp = (a, k) => o => (o[k] || a).bind(o)
const bindingProp = (a, k) => o => (o[k] || a).bind(o)

// Number -> Number -> Number
const divide = curry((a, b) => a / b)

// String -> String
const toUpper = x => x.toUpperCase()

// radians :: Number -> Angle
const radians = divide(2 * Math.PI)

// point :: (Number, Number) -> Point
const point = (x, y) => ({x: x, y: y})

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

//
//setup
//

var myModel = {
	fork: tube("fork", 300, point(50, 200), radians(67)),
	topTube: tube("toptube", 400, point(0, 0), radians(0))
}


// render :: Model -> VTree
const createTubeTree = model => h(
	"div",
	{
		onclick: function() {
			console.log("CLICKED")
		}
	},
	[
		h("span", ["fork len", model.fork.length]),
		h("span", ["top tube len", model.topTube.length]),
	]
)

// changeTube :: Model -> [String] -> a -> Model
const changeTube = curry((model, path, val) => {
	return setPath(path, val, model)
})

// onForkLenChange :: Model -> Event -> ()
const onForkLenChange = m => compose(
	map(snd),
	map(tap(compose(
		a => vdomPatch($graph, a), //TODO find a better approach
		merge(vdomDiff),
		bimap(
			createTubeTree,
			createTubeTree
		)
	))),
	map(bimap(
		constant(m),
		changeTube(m, ["fork", "length"])
	)),
	map(branch),
	parseFloatSafe,
	propPathOr(undefined, ["target", "value"])
)

// createInputsTree :: Model -> VTree
const createInputsTree = model => h("div", [
	h("div", [
		"Top Tube",
		h("input", {
			type: "number",
			onchange: e => {
				console.log("-");
				console.log(myModel.fork.length);
				myModel = either(constant(myModel), identity)(onForkLenChange(model)(e))
				console.log(myModel.fork.length);
			}
		})
	])
])

// insertInto :: (String, DOMNode) -> ()
const insertInto = curry((sel, dom) => map(
	io => io.appendChild(dom),
	$(sel)
))

const $graph = insertInto(
	"#graph",
	vdomCreate(createTubeTree(myModel))
).run()

const $inputs = insertInto(
	"#inputs",
	vdomCreate(createInputsTree(myModel))
).run()
