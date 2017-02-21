// title      : Name Plate
// author     : Rene K. Mueller
// license    : MIT License
// description: create your own name plate
// date       : 2013/04/24
// file       : name_plate.jscad

function create_stone_objects() {
    var objects = [
        CSG.cylinder({start:[0,0,-4], end:[0,0,4], radius: 1}).scale([30,10,1]),
        CSG.cube().scale([30,40,4]).translate([0,-40,0]),
        CSG.cube().scale([32, 2, 7]).translate([0, -10-12-40-20, 0]),
        CSG.cube().scale([34, 2, 9]).translate([0, -10-10-6-40-20, 0])];
    return objects;
}

function create_words(lastName="Merrill", firstName="William Leo", dateSpan"1975-2017",
    epitaph="Man can ask \ God gives no more") {

    var objects = [

    ]

    return objects


}




function main(param) {
    var o = []; // our stack of objects
    var l = []; // our stack of line segments (when rendering vector text)
    var p = []; // our stack of extruded line segments

    return union(create_stone_objects());
}
