# svgToKeyshape

Keyshape doesn't support SVG filters used by Sketch, but it's possible to use CSS instead.

This plugin convert : 

- SVG drop shadow filter into drop-shadow CSS 
- SVG blur filter into Blur CSS   
- Text and Tspan elements into many Text elements, each new Text element has their own origin (it's more simple to edit it into Keyshape) 

## How use it

- You have to select only ONE layer, if necessary group your layers into only one group.
- Go to Plugin Menu > Copy SVG to Keyshape OR use shortcut CMD + SHIFT + C

## Installation

- [Download](../../releases/latest/download/svgtokeyshape.sketchplugin.zip) the latest release of the plugin
- Un-zip
- Double-click on svgtokeyshape.sketchplugin
