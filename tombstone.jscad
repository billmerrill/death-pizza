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
    o[1] = o[1] + (eoSize[1] * -1.0) ;
    epitaphObj = epitaphObj.translate(o);

    return epitaphObj;
}

function layoutJustifiedLine(text, weight, depth, canvas_width) {
    var textObj = makeLineOfText(text, weight, depth, [0,0]);
    var textSize = getObjectSize(textObj);
    var textScale = canvas_width / textSize[0];
    textObj = textObj.scale([textScale, textScale, 1]);
    textSize = getObjectSize(textObj);
    canvas_cursor[1] += textSize[1] * -2;
    textObj = textObj.translate(canvas_cursor);
    return textObj;
}

var canvas_cursor;
function layout(words, config) {
    var lastNameObj, firstNameObj, dateSpanObj, epitaphObj;
    var em = 20;
    // global
    canvas_cursor = [0,0]

    lastNameObj = makeLineOfText(words.lastName,
                               config.lastName.weight,
                               config.lastName.depth,
                               [0,0]);
    var lastNameSize = getObjectSize(lastNameObj)
    var lnScale = config.canvas.width / lastNameSize[0];
    lastNameObj = lastNameObj.scale([lnScale, lnScale, 1]);


    var firstNameObj = layoutJustifiedLine(words.firstName,
                               config.firstName.weight,
                               config.firstName.depth,
                               config.canvas.width);

    var dateSpanObj = layoutJustifiedLine(words.dateSpan,
                                        config.dateSpan.weight,
                                        config.dateSpan.depth,
                                        config.canvas.width);

    var epitaphObj = layoutEpitaph(words, config, canvas_cursor);

    return union(lastNameObj, firstNameObj, dateSpanObj, epitaphObj);
}

function createStone() {
    var objects = [
        CSG.cylinder({start:[0,0,-4], end:[0,0,4], radius: 1}).scale([30,10,1]),
        CSG.cube().scale([30,40,4]).translate([0,-40,0]),
        CSG.cube().scale([32, 2, 7]).translate([0, -10-12-40-20, 0]),
        CSG.cube().scale([34, 2, 9]).translate([0, -10-10-6-40-20, 0])];
    return objects;
}

function main(param) {
    var big_words = {lastName:"mmmmmmmmmmmmmmmmmmmm",
                firstName:"mmmmmmmmmmmmmmmmmmmm",
                dateSpan:"1975 - 2017",
                // epitaph:"mmmm mmmm mmmm mmmm mmmm mmmmmmm mmmmmmm mmmmmm mmmmmmmmm"};
                epitaph:"mmmm mmmm mmmm mmmm mmmm\nmmmmmmm mmmmmmm mmmmmm\nmmmmmmmmm"};
    var bill_words = {lastName:"MERRILL",
                firstName:"William Leo",
                dateSpan:"1975 - 2017",
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
                      'epitaph': {'weight': 4, 'depth': 10}
                    }
    var words =  layout(bill_words, layout_config);
    var stone = createStone();
    return words;
}
