module Main exposing (init, main)

import Browser
import Html exposing (Attribute, Html, div, input, text)
import Html.Attributes exposing (..)
import Html.Events exposing (onInput)
import Svg exposing (svg)
import Svg.Attributes as SA
import Tube exposing (Tube, viewTube)


main =
    Browser.sandbox { init = init, update = update, view = view }


init =
    Tube "top tube" 120


type Msg
    = Change String


update : Msg -> Tube -> Tube
update msg model =
    case msg of
        Change newContent ->
            { model | length = Maybe.withDefault model.length (String.toFloat newContent) }


view : Tube -> Html Msg
view model =
    div []
        [ input [ type_ "number", value (String.fromFloat model.length), onInput Change ] []
        , svg
            [ SA.width "800"
            , SA.height "600"
            , SA.viewBox "0 0 800 600"
            ]
            [ viewTube model
            ]
        ]
