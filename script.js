

var KEYCODE_UP = 38;                
var KEYCODE_DOWN = 40;                
var KEYCODE_LEFT = 37;  
var KEYCODE_RIGHT = 39;        

var scale = 4;

document.onkeydown = handleKeyDown;

var wd;
var ht;
var loader;
var turtle;

prog_cells = [];
grid_cells = [];

function init() {
  stage = new createjs.Stage("pixbot");

  wd = stage.canvas.width;
  ht = stage.canvas.height;

  var context = stage.canvas.getContext("2d");
  context.imageSmoothingEnabled = false;
  context.mozImageSmoothingEnabled = false;
  context.webkitImageSmoothingEnabled = false;

  manifest = [
    {src:"assets/up.png", id:"up"},
    {src:"assets/down.png", id:"down"},
    {src:"assets/left.png", id:"left"},
    {src:"assets/right.png", id:"right"},
    {src:"assets/turtle.png", id:"turtle"},
    {src:"assets/go.png", id:"go"}
  ];

  loader = new createjs.LoadQueue(false);
  loader.addEventListener("complete", handleComplete);
  loader.loadManifest(manifest);
}

var grid;
var program;
var palette;

var command_list = [];

var arrow;
var go_button;

var turtle;
var tile_wd = 70;
var tile_ht = tile_wd;
var grid_x = 4;
var grid_y = 4;

var grid_x_min = 1;
var grid_y_min = 0;
var grid_x_max = 12;
var grid_y_max = 8;

var prog_x_min = 1;
var prog_y_min = 8;
var prog_x_max = 12;
var prog_y_max = 9;

var pad = 4;

// TODO this and CommandMove I think will merge
function Item(name, x, y) {
  var res = loader.getResult(name);
  console.log("name " + name + " " + res);
  this.im = new createjs.Bitmap(res);
  var bounds = this.im.getBounds();
  this.im.scaleX = tile_wd/bounds.width;
  this.im.scaleY = tile_wd/bounds.height;
  this.im.x = x * tile_wd;
  this.im.y = y * tile_wd;
  console.log("new " + name + " at " + x + " " + y);
  
}

function CommandMove(ndx, ndy, name) {
  
  var item = new Item(name, prog_x_min + command_list.length, prog_y_min);
  program.addChild(item.im);
  stage.update();
  
  var dx = ndx;
  var dy = ndy;

  this.execute = function() {
    grid_x += dx;
    grid_y += dy;
    
    var success = true;

    if (grid_x >= grid_x_max) {
      grid_x = grid_x_max - 1;
      success = false;
    }
    if (grid_y >= grid_y_max) {
      grid_y = grid_y_max - 1;
      success = false;
    }
    if (grid_y < grid_y_min) {
      grid_y = grid_y_min;
      success = false;
    }
    if (grid_x < grid_x_min) {
      grid_x = grid_x_min;
      success = false;
    }
    update = true;
    return success;
  }

} // CommandMove

function makeCell(i, j, color) {
  var cell = new createjs.Shape();
  cell.x = i * tile_wd;
  cell.y = j * tile_ht;
  cell.graphics.beginFill(color).drawRect(pad, pad, tile_wd - pad, tile_ht - pad);
  return cell;
}

function drawGrid() {
  cell_list = []; 
  for (var i = grid_x_min; i < grid_x_max; i++) {
    for (var j = grid_y_min; j < grid_y_max; j++) {
      var cell = makeCell(i, j, "#cccccc"); 
      cell_list.push(cell);
      grid.addChild(cell);
    }
  }

  return cell_list;
}

// TODO make this and drawGrid take x1,y1,x2,y2 parameters and merge them
function drawProgram() {
  cell_list = []; 
  for (var i = prog_x_min; i < prog_x_max; i++) {
    for (var j = prog_y_min; j < prog_y_max; j++) {
      var cell = makeCell(i, j, "#bbffbb");
      cell_list.push(cell);
      program.addChild(cell);
    }
  }
  return cell_list;
}

var prog_counter = 0;
var is_executing = false;

function runProgram(event) {
  console.log("execute");
  prog_counter = 0;
  is_executing = true;

  for (var i = 0; i < prog_cells.length; i++) {
    prog_cells[i].graphics.beginFill("#bb99bb").drawRect(pad, pad, tile_wd - pad, tile_ht - pad);
  }
}

function handleComplete() {
  
  grid = new createjs.Container();
  stage.addChild(grid);
  grid_cells = drawGrid();
 
  program = new createjs.Container();
  stage.addChild(program);
  prog_cells = drawProgram();

  arrow = new Item("up", 0, 1);
  //arrow.im.addEventListener("click", function(event) {
  //  command_list.push(new CommandMove());
  // }); 
  stage.addChild(arrow.im);

  var go_cell = makeCell(0, grid_y_max - 1, "#22ff22");
  go_cell.addEventListener("click", runProgram);
  stage.addChild(go_cell);
  go_button = new Item("go", 0, grid_y_max - 1);
  stage.addChild(go_button.im);

  {
  turtle = new createjs.Bitmap(loader.getResult("turtle"));
  var bounds = turtle.getBounds();
  turtle.scaleX = tile_wd/bounds.width;
  turtle.scaleY = tile_wd/bounds.height;
  turtle.x = tile_wd * grid_x;
  turtle.y = tile_wd * grid_y;
  stage.addChild(turtle);
  }

  stage.update();

  createjs.Ticker.on("tick", tick);
  createjs.Ticker.setFPS(2);
}

var update = false;

function tick(event) {
  
  if (is_executing) {

    if (prog_counter < command_list.length) {
      var success = command_list[prog_counter].execute();
      turtle.x = tile_wd * grid_x;
      turtle.y = tile_wd * grid_y;
      
      var color = "#22ff22";
      if (!success) {
        color = "#ff2222";
      }

      for (var i = 0; i < prog_counter; i++) {
        prog_cells[i].graphics.beginFill("#559955").drawRect(pad, pad, tile_wd - pad, tile_ht - pad);
      }
      prog_cells[prog_counter].graphics.beginFill(color).drawRect(pad, pad, tile_wd - pad, tile_ht - pad);
      prog_counter += 1;
      stage.update(event);
    } else {
      console.log("done executing " + command_list.length);
      prog_counter = 0;
      is_executing = false;

      for (var i = 0; i < prog_cells.length; i++) {
        prog_cells[i].graphics.beginFill("#bb99bb").drawRect(pad, pad, tile_wd - pad, tile_ht - pad);
      }
    }
  }
  update = false;
}

function handleKeyDown(e) {
  // cross browse issue?
  if (!e) { var e = window.event; }

  if ((update === false) && (command_list.length < prog_x_max - prog_x_min)) {
    update = true;
  switch (e.keyCode) {
    case KEYCODE_LEFT:
      command_list.push(new CommandMove(-1, 0, "left"));
      return false;
    case KEYCODE_RIGHT:
      command_list.push(new CommandMove( 1, 0, "right"));
      return false;
   case KEYCODE_UP:
      command_list.push(new CommandMove( 0,-1, "up"));
      return false;
   case KEYCODE_DOWN:
      command_list.push(new CommandMove( 0, 1, "down"));
      return false;
  }
  }
}

