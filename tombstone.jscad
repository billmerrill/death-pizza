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
function getBoundsSize(b) {
    return [ b[1].x-b[0].x, b[1].y-b[0].y, b[1].z-b[0].z];
}

function getObjectSize(o) {
    return getBoundsSize(o.getBounds());

}




function makeLineOfText(text, weight, depth, origin){
    var plines = [];

    var l = vector_text(0, 0, text);
    l.forEach(function(s) {
        plines.push(rectangular_extrude(s, {
            w: weight,
            h: depth
        }));
    });

    var os = union(plines).translate([origin[0], origin[1], 0]);
    return os;
}





function prepareEpiText(words, config) {
    /**
    Prepare the Epitaph.
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
        lines.forEach(function(l, i, arr) {arr[i] = l.trim();});
        // lines.map(Function.prototype.call, String.prototype.trim);
    } else {
        word_parts = words.split(/[ \t]+/);
        for (wp in word_parts) {
            if ((line.length + word_parts[wp].length + 1) > char_max) {
                lines.push(line);
                line = "";
            }
            if (word_parts[wp].length > 0) {
                if (line.length > 0) {
                    line += " "
                }
                line += word_parts[wp];

            }
        }
        lines.push(line);
    }

    return lines;
}

function layoutEpitaph(words, config, o) {

    var epTexts = prepareEpiText(words.epitaph, config);
    var epiObjs = [];
    var epObj, epSize;
    var singleLineSize;

    var epiOrigin = [0,0];
    var maxEpitaphLength = 0;

    // generate lines of epitaph CAD objections
    for (t in epTexts) {
        epObj = makeLineOfText(epTexts[t],
                                config.epitaph.weight,
                                config.epitaph.depth,
                                [0,0]);
        epSize = getObjectSize(epObj);

        if (epSize[0] > maxEpitaphLength) {
            maxEpitaphLength = epSize[0];
        }
        if (t > 0) {
            epiOrigin[1] = epiOrigin[1] + epSize[1] * -1;
        }
        epObj = epObj.translate(epiOrigin);
        epiObjs.push(epObj);
    }

    // center epitaph lines
    epiObjs.forEach(function(l, i, arr) {
        var lSize = getBoundsSize(l.getBounds());
        if (lSize[0] != maxEpitaphLength) {
            // epiObjs[i] = l.translate([10, 0,0]);
            epiObjs[i] = l.translate([(maxEpitaphLength - lSize[0])/2, 0,0]);
        }
    });

    var epitaphObj = union(epiObjs);
    var eoSize = getObjectSize(epitaphObj);
    var eoScale = config.canvas.width / eoSize[0]
    epitaphObj = epitaphObj.scale([eoScale, eoScale, 1]);

    eoSize = getObjectSize(epitaphObj)
    // add the height of single line for cussor spacing
    canvas_cursor[1] += -1 * (epSize[1] * eoScale);
    epitaphObj = epitaphObj.translate(canvas_cursor);

    return epitaphObj;
}

function layoutJustifiedLine(text, weight, depth, canvas_width, margins) {
    // canvas_cursor is global
    var textObj = makeLineOfText(text, weight, depth, [0,0]);
    var textSize = getObjectSize(textObj);
    var textScale = canvas_width / textSize[0];
    textObj = textObj.scale([textScale, textScale, 1]);
    textSize = getObjectSize(textObj);
    canvas_cursor[1] += textSize[1] * -1;
    textObj = textObj.translate(canvas_cursor);
    canvas_cursor[1] += -1 * textSize[1] * margins.bottom;
    return textObj;
}

var canvas_cursor;
function layout(words, config) {
    var lastNameObj, firstNameObj, dateSpanObj, epitaphObj;
    var em = 20;
    // global
    canvas_cursor = [0,0]

    lastNameObj = layoutJustifiedLine(words.lastName,
                                        config.lastName.weight,
                                        config.lastName.depth,
                                        config.canvas.width,
                                        {'bottom': .8}
                                        );

    firstNameObj = layoutJustifiedLine(words.firstName,
                               config.firstName.weight,
                               config.firstName.depth,
                               config.canvas.width,
                                        {'bottom': .5}
                                    );

    dateSpanObj = layoutJustifiedLine(words.dateSpan,
                                        config.dateSpan.weight,
                                        config.dateSpan.depth,
                                        config.canvas.width,
                                        {'bottom': .5});

    epitaphObj = layoutEpitaph(words, config, canvas_cursor);

    return union(lastNameObj, firstNameObj, dateSpanObj, epitaphObj);
}

function createStone() {
        // CSG.cube({corner1:[0,0,0], corner2:[100,-120,8]})
    var objects = [
        CSG.cylinder({start:[0,0,-4], end:[0,0,4], radius: 1}).scale([30,10,1]),
        CSG.cube().scale([30,40,4]).translate([0,-40,0]),
        CSG.cube().scale([32, 2, 7]).translate([0, -10-12-40-20, 0]),
        CSG.cube().scale([34, 2, 9]).translate([0, -10-10-6-40-20, 0])];
    return objects;
}

function wrapWords(words, config) {
    var wordsSize, p, c1, c2, objects, monument;
    wordsSize = getObjectSize(words);
    p = config.monument.padding
    bodyZ = config.monument.body_thickness
    step = config.monument.base_dims;
    c1 = [-p, 0, -bodyZ/2.0];
    c2 = [wordsSize[0] + p, -1 * wordsSize[1] - 2*p, bodyZ/2.0];
    // objects = [ CSG.cube({corner1: c1, corner2: c2}),
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
            corner1: [c1[0] - 2*step[0], c2[1] - step[1], c1[2] - 2*step[2]],
            corner2: [c2[0] + 2*step[0], c2[1] - 2*step[1], c2[2] + 2*step[2]]
        }),
        //top curve
        CSG.cylinder({ // object-oriented
            start: [0, 0, c1[2]],
            end: [0, 0, c2[2]],
            diameter: 1 // true cylinder
        }).scale([(wordsSize[0] + (2 * p)) / 2, (wordsSize[1] / 2) / 2, 1])
        .translate([wordsSize[0] / 2, 0, 0])
    ];

    return difference(union(objects), make_signature(c1, c2, config));
}

function make_signature(c1, c2, config) {
    // c1 and c2 are the defining corners of the main slab.
    var bodyZ = config.monument.body_thickness,
        step = config.monument.base_dims,
        sigObj, sigSize, sigScale;
    sigObj = makeLineOfText("soon.rip", 3, 20, [0,0]);
    sigSize = getObjectSize(sigObj);
    sigScale =  (step[1]*.8) / sigSize[1];
    sigObj = sigObj.scale(sigScale, sigScale, 0);
    sigObj = sigObj.rotateY(180);
    sigSize = getObjectSize(sigObj);
    sigObj = sigObj.translate([1.5*step[1], c2[1]-(.85*sigSize[1]), -1*step[2] - .7*(bodyZ/2)]);

    return sigObj;
}


function build_tombstone(textConfig, layoutConfig) {
    var words =  layout(textConfig, layoutConfig);
    var stone = wrapWords(words, layoutConfig);
    return difference(stone, words);
}

function main(param) {

    var big_words = {lastName:"mmmmmmmmmmmmmmmmmmmm",
                firstName:"mmmmmmmmmmmmmmmmmmmm",
                dateSpan:"1975 - 2055",
                // epitaph:"mmmm mmmm mmmm mmmm mmmm mmmmmmm mmmmmmm mmmmmm mmmmmmmmm"};
                epitaph:"mmmm mmmm mmmm mmmm mmmm\nmmmmmmm mmmmmmm mmmmmm\nmmmmmmmmm"};
    var bill_words = {lastName:"MERRILL",
                firstName:"William Leo",
                dateSpan:"1975 - 2055",
                epitaph:"Man can ask\nGod gives no more"};
    var andrew_words = {lastName:"COLE",
                firstName:"Andrew O'Connor",
                dateSpan:"1982 - 2017",
                epitaph:"kinda cool to have something named after you, kinda less cool if it is a shit bug"};
    var layout_config = { 'canvas': { 'width': 100.0,
                                      'freeform_text_width': 25},
                      'lastName': {'weight': 4, 'depth': 10},
                      'firstName': {'weight': 4, 'depth': 10},
                      'dateSpan': {'weight': 4, 'depth': 10},
                      'epitaph': {'weight': 4, 'depth': 10},
                      'monument': { 'padding': 10,
                                    'body_thickness': 20,
                                    'base_dims': [10, 10, 10]
                                    }
                    }
    return build_tombstone(big_words, layout_config);
}
