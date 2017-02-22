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

function create_stone_objects() {
    var objects = [
        CSG.cylinder({start:[0,0,-4], end:[0,0,4], radius: 1}).scale([30,10,1]),
        CSG.cube().scale([30,40,4]).translate([0,-40,0]),
        CSG.cube().scale([32, 2, 7]).translate([0, -10-12-40-20, 0]),
        CSG.cube().scale([34, 2, 9]).translate([0, -10-10-6-40-20, 0])];
    return objects;
}

function line_of_text(text, config) {
    var plines = [];

    var l = vector_text(config[2], config[3], text);
    l.forEach(function(s) {
        plines.push(rectangular_extrude(s, {
            w: config[0],
            h: config[1]
        }));
    });

    return union(plines);
}

function bounds_size(b) {
    return [ b[1].x-b[0].x, b[1].y-b[0].y, b[1].z-b[0].z];
}

function create_words(words) {
    var sizes = {'lastName': [5,10, 0,0],
                 'firstName': [5,10, 0, -30],
                 'dateSpan': [5,10, 0, -60],
                 'epitaph': [5,10, 0, -90],}
    var objects = []

    objects.push(line_of_text(words.lastName, sizes['lastName']));
    objects.push(line_of_text(words.firstName, sizes['firstName']));
    objects.push(line_of_text(words.dateSpan, sizes['dateSpan']));
    objects.push(line_of_text(words.epitaph, sizes['epitaph']));

    console.log(bounds_size(union(objects).getBounds()));

    return objects


}

function test_word() {
    var objects = [line_of_text("MERRILL", [3,10, 0, 0])];
    console.log(bounds_size(union(objects).getBounds()));
    return objects;
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

function scaleToTarget(obj, target) {
    var obj_size = bounds_size(obj.getBounds());
    var scalar = target / obj_size[0];
    obj = obj.scale([scalar, scalar, 1]);
    return obj;
}

function makeJustifiedLineOfText(text, weight, depth, origin, canvas_width) {
    console.log("origin for " + text + " : " + origin);
    obj = makeLineOfText(text, weight, depth, origin);
    // obj = scaleToTarget(obj, canvas_width);
    return obj;
}

function prepareEpiText(words) {
    var lines = words.trim().split("\n");
    for (var l in lines) {
        lines[l] = lines[l].trim();
    }
    return lines;
}

function buildEpitaph(words, config) {

}

function layout(words, config) {
    var em = 20;
    var o = [0,0]
    var lastNameObj = makeLineOfText(words.lastName,
                               config.lastName.weight,
                               config.lastName.depth,
                               [0,0]);
    var lastNameBounds = lastNameObj.getBounds();
    var lastNameSize = bounds_size(lastNameBounds);
    var lnScale = config.canvas.width / lastNameSize[0];
    lastNameObj = lastNameObj.scale([lnScale, lnScale, 1]);

    var firstNameObj = makeLineOfText(words.firstName,
                               config.firstName.weight,
                               config.firstName.depth,
                               [0,0]);
    var fnBounds = firstNameObj.getBounds();
    var fnSize = bounds_size(fnBounds);
    var fnScale = config.canvas.width / fnSize[0];
    firstNameObj = firstNameObj.scale([fnScale, fnScale, 1]);
    fnBounds = firstNameObj.getBounds();
    fnSize = bounds_size(fnBounds);

    o[1] = fnSize[1] * -2;
    firstNameObj = firstNameObj.translate(o);

    var dateSpanObj = makeLineOfText(words.dateSpan,
                               config.dateSpan.weight,
                               config.dateSpan.depth,
                               [0,0]);
    var dsBounds = dateSpanObj.getBounds();
    var dsSize = bounds_size(dsBounds);
    var dsScale = config.canvas.width / dsSize[0];
    dateSpanObj = dateSpanObj.scale([dsScale, dsScale, 1]);
    var dsBounds = dateSpanObj.getBounds();
    var dsSize = bounds_size(dsBounds);
    o[1] = o[1] + dsSize[1] * -2
    dateSpanObj = dateSpanObj.translate(o);


    var epTexts = prepareEpiText(words.epitaph);
    var epiObjs = [];
    var epObj, epBounds, epSize, epScale;

    o2 = [0,0];
    var is_first = true;

    for (t in epTexts) {

        epObj = makeLineOfText(epTexts[t],
                                config.epitaph.weight,
                                config.epitaph.depth,
                                [0,0]);
        epBounds = epObj.getBounds();
        epSize = bounds_size(epBounds);
        if (is_first) {
            is_first = false;
        } else {
            o2[1] = o2[1] + epSize[1] * -1;
            epObj = epObj.translate(o2);
        }
        epiObjs.push(epObj);
    }

    var epitaphObj = union(epiObjs);
    var eoBounds = epitaphObj.getBounds();
    var eoSize = bounds_size(eoBounds);
    var eoScale = config.canvas.width / eoSize[0]
    epitaphObj = epitaphObj.scale([eoScale, eoScale, 1]);
    eoBounds = epitaphObj.getBounds();
    eoSize = bounds_size(eoBounds);
    o[1] = o[1] + (eoSize[1] * -1.0) ;
    epitaphObj = epitaphObj.translate(o);

    // return union(lastNameObj, firstNameObj);
    return union(lastNameObj, firstNameObj, dateSpanObj, epitaphObj);
}

function main(param) {
    var o = []; // our stack of objects
    var l = []; // our stack of line segments (when rendering vector text)
    var p = []; // our stack of extruded line segments
    var big_words = {lastName:"mmmmmmmmmmmmmmmmmmmm",
                firstName:"mmmmmmmmmmmmmmmmmmmm",
                dateSpan:"1975 - 2017",
                epitaph:"mmmm mmmmmmm mmmmmmm mmmmmmm mmmmmm mmmmmmmmm"};
    var bill_words = {lastName:"MERRILL",
                firstName:"William Leo",
                dateSpan:"1975 - 2017",
                epitaph:"Man can ask\nGod gives no more"};
    var andrew_words = {lastName:"COLE",
                firstName:"Andrew O'Connor",
                dateSpan:"1983 - 2017",
                epitaph:"kinda cool to have something\n named after you, kinda less\ncool if it is a shit bug"};
    var layout_config = { 'canvas': { 'width': 100.0},
                      'lastName': {'weight': 4, 'depth': 10},
                      'firstName': {'weight': 4, 'depth': 10},
                      'dateSpan': {'weight': 4, 'depth': 10},
                      'epitaph': {'weight': 4, 'depth': 10}
                    }
    // return test_word();
    return layout(bill_words, layout_config);
    // return union(create_words(test_words)).scale([.1, .1, 1]);
    // return create_stone_objects();
}
