

var KEYCODE_UP = 38;                
var KEYCODE_DOWN = 40;                
var KEYCODE_LEFT = 37;  
var KEYCODE_RIGHT = 39;        

var scale = 4;

//document.onkeydown = handleKeyDown;

var wd;
var ht;
var loader;
var turtle;

function init() {
  stage = new createjs.Stage("pixbot");

  wd = stage.canvas.width;
  ht = stage.canvas.height;

  var context = stage.canvas.getContext("2d");
  context.imageSmoothingEnabled = false;
  context.mozImageSmoothingEnabled = false;
  context.webkitImageSmoothingEnabled = false;

  manifest = [
    {src:"assets/arrow.png", id:"arrow"},
    {src:"assets/turtle.png", id:"turtle"}
  ];

  loader = new createjs.LoadQueue(false);
  loader.addEventListener("complete", handleComplete);
  loader.loadManifest(manifest);
}

var turtle;
var arrow;
var tile_wd = 96;
var grid_x = 4;
var grid_y = 4;

function handleComplete() {

  {
  arrow = new createjs.Bitmap(loader.getResult("arrow"));
  var bounds = arrow.getBounds();
  arrow.scaleX = tile_wd/bounds.width;
  arrow.scaleY = tile_wd/bounds.height;
  arrow.x = tile_wd;
  arrow.y = tile_wd;
  stage.addChild(arrow);
  }

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
  createjs.Ticker.setFPS(15);
}

function tick(event) {

  stage.update(event);
}


function handleKeyDown(e) {
  // cross browse issue?
  if (!e) { var e = window.event; }

  var step = scale;
  switch (e.keyCode) {
    case KEYCODE_LEFT:
      return false;
    case KEYCODE_RIGHT:
      return false;
   case KEYCODE_UP:
      return false;
   case KEYCODE_DOWN:
      return false;
  }
 

}
