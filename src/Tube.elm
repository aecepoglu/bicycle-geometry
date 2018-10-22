module Tube exposing (Tube, viewTube)

import Browser
import Html exposing (Html)
import Svg exposing (..)
import Svg.Attributes exposing (..)


init =
    { name = "top tube", length = 50 }


type alias Tube =
    { name : String
    , length : Float
    }



--type Msg
--    = Change Float
-- update : Msg -> Tube -> Tube
-- update msg model =
--     case msg of
--         Change val ->
--             { model | length = val }


viewTube : Tube -> Svg msg
viewTube model =
    rect
        [ x "10"
        , y "10"
        , width (String.fromFloat model.length)
        , height "30"
        , rx "15"
        , ry "15"
        ]
        []
