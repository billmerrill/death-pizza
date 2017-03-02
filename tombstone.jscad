/*
        /=====\
    /=============\
    + 0,0         +
    |             |
    |             |
    |             |
    |             |
    |             |
  +-+-------------+-+
+-+-----------------+-+
+---------------------+
 */

/* jslint esversion: 6 */
var GLOBAL_CANVAS_CURSOR;

function getBoundsSize(b) {
    return [b[1].x - b[0].x, b[1].y - b[0].y, b[1].z - b[0].z];
}

function getObjectSize(o) {
    return getBoundsSize(o.getBounds());
}

function makeLineOfText(text, weight, depth, origin) {
    var plines = [],
        l = vector_text(0, 0, text);
    l.forEach(function(s) {
        plines.push(rectangular_extrude(s, {
            w: weight,
            h: depth
        }));
    });

    return union(plines).translate([origin[0], origin[1], 0]);
}

function prepareEpitaphText(words, config) {
    /**
    Prepare the epitaph in to an array of lines
    A- If an epitaph has new lines, use its formatting.
    B- If it has none, break it down in to lines of canvas.freeform_text_width length
    **/
    var lines = [],
        line = "",
        char_max = config.canvas.freeform_text_width,
        wp, word_parts;

    words = words.trim();
    if (words.includes("\n")) {
        lines = words.split(/[\n]+/);
        lines.forEach(function(l, i, arr) {
            arr[i] = l.trim();
        });
    } else {
        word_parts = words.split(/[ \t]+/);
        for (wp in word_parts) {
            if ((line.length + word_parts[wp].length + 1) > char_max) {
                lines.push(line);
                line = "";
            }
            if (word_parts[wp].length > 0) {
                if (line.length > 0) {
                    line += " ";
                }
                line += word_parts[wp];
            }
        }
        lines.push(line);
    }

    return lines;
}

function layoutEpitaph(epitaph, config, o) {
    var epTexts = prepareEpitaphText(epitaph, config),
        t, epLineHeight,
        epiObjs = [],
        epiOrigin = [0, 0],
        maxEpitaphLength = 0,
        epObj, epSize,
        epitaphObj, eoSize, eoScale;

    // generate lines of epitaph CAD objections
    for (t in epTexts) {
        epObj = makeLineOfText(epTexts[t],
            config.epitaph.weight,
            config.epitaph.depth, [0, 0]);
        epSize = getObjectSize(epObj);
        if (t == 0) {
            epLineHeight = epSize[1];
        }

        if (epSize[0] > maxEpitaphLength) {
            maxEpitaphLength = epSize[0];
        }
        if (t > 0) {
            epiOrigin[1] = epiOrigin[1] + epLineHeight * -1.2;
        }
        epObj = epObj.translate(epiOrigin);
        epiObjs.push(epObj);
    }

    // center epitaph lines
    epiObjs.forEach(function(l, i, arr) {
        var lSize = getObjectSize(l);
        if (lSize[0] != maxEpitaphLength) {
            epiObjs[i] = l.translate([(maxEpitaphLength - lSize[0]) / 2, 0, 0]);
        }
    });

    epitaphObj = union(epiObjs);
    eoSize = getObjectSize(epitaphObj);
    eoScale = config.canvas.width / eoSize[0];
    if (eoScale > 1) {
        eoScale = 1;
    }
    epitaphObj = epitaphObj.scale([eoScale, eoScale, 1]);

    eoSize = getObjectSize(epitaphObj);
    // add the height of single line for cussor spacing
    GLOBAL_CANVAS_CURSOR[1] += -1 * (epSize[1] * eoScale);
    epitaphObj = epitaphObj.translate(GLOBAL_CANVAS_CURSOR);

    return epitaphObj;
}


function layoutJustifiedLine(text, weight, depth, canvas_width, margins, max_scale=1) {
    // GLOBAL_CANVAS_CURSOR is global
    var textObj = makeLineOfText(text, weight, depth, [0, 0]),
        textSize = getObjectSize(textObj),
        textScale = canvas_width / textSize[0];
    if (textScale > max_scale) {
        textScale = max_scale;
    }
    textObj = textObj.scale([textScale, textScale, 1]);
    textSize = getObjectSize(textObj);
    GLOBAL_CANVAS_CURSOR[1] += textSize[1] * -1;
    textObj = textObj.translate(GLOBAL_CANVAS_CURSOR);
    GLOBAL_CANVAS_CURSOR[1] += -1 * textSize[1] * margins.bottom;
    return textObj;
}


function layoutTraditional(words, config) {
    // global
    GLOBAL_CANVAS_CURSOR = [0, 0];

    var maxTextLineWidth, textObjs;

    textObjs = [
        layoutJustifiedLine(words.lastName,
            config.lastName.weight,
            config.lastName.depth,
            config.canvas.width, {
                'bottom': 0.8
            },
            0.99
        ),
        layoutJustifiedLine(words.firstName,
            config.firstName.weight,
            config.firstName.depth,
            config.canvas.width, {
                'bottom': 0.5
            },
            0.5
        ),
        layoutJustifiedLine(words.dateSpan,
            config.dateSpan.weight,
            config.dateSpan.depth,
            config.canvas.width, {
                'bottom': 0.5
            },
            0.5),
        layoutEpitaph(words.epitaph, config, GLOBAL_CANVAS_CURSOR)
    ];

    maxTextLineWidth = Math.max(...textObjs.map(function(x) {
        return getObjectSize(x)[0];
    }));
    textObjs.forEach(function(l, i, arr) {
        var lSize = getObjectSize(l);
        if (lSize[0] != maxTextLineWidth) {
            textObjs[i] = l.translate([(maxTextLineWidth - lSize[0]) / 2, 0, 0]);
        }
    });

    return union(...textObjs);
}

function layoutComic(words, config) {
    // global
    GLOBAL_CANVAS_CURSOR = [0, 0];

    var maxTextLineWidth, textObjs;

    textObjs = [
        layoutJustifiedLine("Here lies",
            config.lastName.weight,
            config.lastName.depth,
            config.canvas.width, {
                'bottom': 1
            },
            0.3
        ),
        layoutJustifiedLine(words.firstName,
            config.firstName.weight,
            config.firstName.depth,
            config.canvas.width, {
                'bottom': 1
            },
            0.99
        ),
        layoutEpitaph('"' + words.epitaph + '"', config, GLOBAL_CANVAS_CURSOR)
    ];

    maxTextLineWidth = Math.max(...textObjs.map(function(x) {
        return getObjectSize(x)[0];
    }));
    textObjs.forEach(function(l, i, arr) {
        var lSize = getObjectSize(l);
        if (lSize[0] != maxTextLineWidth) {
            textObjs[i] = l.translate([(maxTextLineWidth - lSize[0]) / 2, 0, 0]);
        }
    });

    return union(...textObjs);
}

function createStone() {
    var objects = [
        CSG.cylinder({
            start: [0, 0, -4],
            end: [0, 0, 4],
            radius: 1
        }).scale([30, 10, 1]),
        CSG.cube().scale([30, 40, 4]).translate([0, -40, 0]),
        CSG.cube().scale([32, 2, 7]).translate([0, -10 - 12 - 40 - 20, 0]),
        CSG.cube().scale([34, 2, 9]).translate([0, -10 - 10 - 6 - 40 - 20, 0])
    ];
    return objects;
}

function buildStoneAroundWords(words, config) {
    var wordsSize, p, bodyZ, step, c1, c2, objects, monument;
    wordsSize = getObjectSize(words);
    p = config.monument.padding;
    bodyZ = config.monument.body_thickness;
    step = config.monument.base_dims;
    c1 = [-p, 0, -bodyZ / 2.0];
    c2 = [wordsSize[0] + p, -1 * wordsSize[1] - 2 * p, bodyZ / 2.0];
    objects = [
        // body
        CSG.cube({
            corner1: c1,
            corner2: c2
        }),
        // top step
        CSG.cube({
            corner1: [c1[0] - step[0], c2[1], c1[2] - step[2]],
            corner2: [c2[0] + step[0], c2[1] - step[1], c2[2] + step[2]]
        }),
        // bottom step
        CSG.cube({
            corner1: [c1[0] - 2 * step[0], c2[1] - step[1], c1[2] - 2 * step[2]],
            corner2: [c2[0] + 2 * step[0], c2[1] - 2 * step[1], c2[2] + 2 * step[2]]
        }),
        //top curve
        CSG.cylinder({
            start: [0, 0, c1[2]],
            end: [0, 0, c2[2]],
            diameter: 1,
            resolution: 64
        }).scale([(wordsSize[0] + (2 * p)) / 2, (wordsSize[1] / 2) / 2, 1])
        .translate([wordsSize[0] / 2, 0, 0])
    ];

    return difference(union(objects), makeSignature(c1, c2, config));
}

function makeSignature(c1, c2, config) {
    // c1 and c2 are the defining corners of the main slab.
    var bodyZ = config.monument.body_thickness,
        step = config.monument.base_dims,
        sigObj, sigSize, sigScale;
    sigObj = makeLineOfText("soon.rip", 3, 20, [0, 0]);
    sigSize = getObjectSize(sigObj);
    sigScale = (step[1] * 0.8) / sigSize[1];
    sigObj = sigObj.scale(sigScale, sigScale, 0);
    sigObj = sigObj.rotateY(180);
    sigSize = getObjectSize(sigObj);
    sigObj = sigObj.translate([1.5 * step[1], c2[1] - (0.85 * sigSize[1]), -1 * step[2] - 0.7 * (bodyZ / 2)]);

    return sigObj;
}

function getFinalScale(obj, bounds) {
    var objSize = getObjectSize(obj),
        scales = [bounds[0] / objSize[0], bounds[1] / objSize[1], bounds[2] / objSize[2]];
    scale = Math.min(bounds[0] / objSize[0], bounds[1] / objSize[1], bounds[2] / objSize[2]);
    return scale;
}

function scaleToBounds(obj, bounds) {
    scale = getFinalScale(obj, bounds);
    obj = obj.scale(scale, scale, scale);
    return obj;
}

function buildTombstone(textConfig, layoutConfig) {
    var words, stone, momument;
    if (layoutConfig.monument.style === 'comic') {
        words = layoutComic(textConfig, layoutConfig);
    } else {
        words = layoutTraditional(textConfig, layoutConfig);
    }
    words = words.translate([0, 0, (layoutConfig.monument.body_thickness / 2) - layoutConfig.monument.engrave_depth]);
    stone = buildStoneAroundWords(words, layoutConfig).setColor([0.4, 0.4, 0.4]);
    monument = difference(stone, words);
    monument = monument.center();
    monument = monument.rotateX(90);

    return scaleToBounds(monument, layoutConfig.monument.final_size_mm);
}

function main(param) {
    // param = {lastName: 'x',
    //          firstName: 'The Terminator',
    //          dateSpan: 'x',
    //          epitaph: "I'll be back"
    //      };
    var text_config = {
        lastName: param.lastName,
        firstName: param.firstName,
        dateSpan: param.dateSpan,
        epitaph: param.epitaph
        },
        layout_config = {
            'canvas': {
                'width': 100.0,
                'freeform_text_width': 25
            },
            'lastName': {
                'weight': 4,
                'depth': 10
            },
            'firstName': {
                'weight': 4,
                'depth': 10
            },
            'dateSpan': {
                'weight': 4,
                'depth': 10
            },
            'epitaph': {
                'weight': 4,
                'depth': 10
            },
            'monument': {
                'padding': 10,
                'body_thickness': 20,
                'base_dims': [10, 10, 10],
                'engrave_depth': 4,
                'style': 'comic',
                'final_size_mm': [100, 100, 100]
            }
        };

    return buildTombstone(text_config, layout_config);
}
