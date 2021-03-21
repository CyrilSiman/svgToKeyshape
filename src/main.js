import sketch from 'sketch'
import Document from 'sketch/dom'
import parser from 'fast-xml-parser'

const attributeNamePrefix = '@_'

const options = {
    attributeNamePrefix,
    ignoreAttributes: false,
    ignoreNameSpace: false,
}

const jsonOptions = {
    attributeNamePrefix,
    ignoreAttributes: false,
    ignoreNameSpace: false,
    format: true,
    indentBy: '  ',
}

const replaceFilterAndText = (elem, convertFilter, parent) => {

    let textElements = elem['text']
    const newTextArray = []

    if(textElements) {
        if (!(textElements instanceof Array)) {
            textElements = [textElements]
        }

        textElements.forEach(textElement => {
            let tspans = textElement.tspan

            if (!(tspans instanceof Array)) {
                tspans = [tspans]
            }

            tspans.forEach((tspan,index) => {

                if(tspan['#text'] && tspan['#text'] !== '') {
                    const newText = {
                        ...textElement,
                        ...tspan,
                        '@_id' : `${textElement['@_id']}-${index}`
                    }
                    delete newText.tspan
                    newTextArray.push(newText)
                }
            })
        })

        elem['text'] = newTextArray
    }

    Object.keys(elem).forEach(key => {
        if (!key.startsWith('@') && !key.startsWith('#')) {
            let newElements = elem[key]

            if (!(newElements instanceof Array)) {
                newElements = [newElements]
            }

            newElements.forEach(element => {
                replaceFilterAndText(element, convertFilter, parent)
            })
        }
    })

    const filterName = elem['@_filter']
    if (filterName) {
        elem['@_filter'] = convertFilter[filterName]
    }
}

const colorValue = (matrix) => {
    const rgba = matrix.split('  ')
    const rDecimal = rgba[0].split(' ')[4] * 255
    const gDecimal = rgba[1].split(' ')[4] * 255
    const bDecimal = rgba[2].split(' ')[4] * 255
    const alphaDecimal = rgba[3].split(' ')[3]

    return `rgba(${rDecimal},${gDecimal},${bDecimal},${alphaDecimal})`
}

export default function () {

    let document = Document.getSelectedDocument()
    let selectedLayers = document.selectedLayers

    if (selectedLayers.length < 1) {
        sketch.UI.alert('Error', '🚫️ None layer selected.🚫️')
        return
    }

    if (selectedLayers.length > 1) {
        sketch.UI.alert('Error', '🚫️ Too many layer selected.🚫️')
        return
    }

    const svg = sketch.export(selectedLayers.layers, {
        formats: 'svg',
        output: false
    })

    const svgContent = svg[0].toString()

    const jsonObj = parser.parse(svgContent, options)

    const convertFilter = {}
    if (jsonObj.svg.defs && jsonObj.svg.defs.filter) {
        let filters = jsonObj.svg.defs.filter
        if (!(filters instanceof Array)) {
            filters = [filters]
        }

        filters.forEach(filter => {
            if (filter.feOffset && filter.feGaussianBlur && filter.feColorMatrix) {

                const id = `url(#${filter['@_id']})`
                const xOffset = filter.feOffset['@_dx']
                const yOffset = filter.feOffset['@_dy']
                const blurCoeff = filter.feGaussianBlur['@_stdDeviation']
                const color = colorValue(filter.feColorMatrix['@_values'])

                convertFilter[id] = `drop-shadow(${xOffset} ${yOffset} ${blurCoeff} ${color})`

            } else if (filter.feGaussianBlur) {

                const id = `url(#${filter['@_id']})`
                const blurCoeff = filter.feGaussianBlur['@_stdDeviation']

                convertFilter[id] = `blur(${blurCoeff})`
            }
        })

        delete jsonObj.svg.defs.filter
    }

    replaceFilterAndText(jsonObj.svg.g, convertFilter, null)

    const j2xParser = new parser.j2xParser(jsonOptions)
    const cleanSvg = j2xParser.parse(jsonObj, jsonOptions)

    const pasteBoard = NSPasteboard.generalPasteboard()
    pasteBoard.declareTypes_owner([NSPasteboardTypeString], null)
    pasteBoard.setString_forType(cleanSvg, NSPasteboardTypeString)

    sketch.UI.message('👍 SVG copy in your pasteboard 👍')

}

