(function(){
  var step = 40;
  var destinations = [];
  var points = 10;
  var width = step * points;
  var board = Snap("#board");


  function drawBoard(board, size){
    points = size || points;
    width = step * points;
    var offset = 0;

    var field = board.rect(0, 0, width, width).drag();
    field.attr('fill','#fff')

    var counter = offset;

    while(counter <= width+offset) {
      x = board.rect(offset, counter, width, 1);
      y = board.rect(counter, offset, 1, width);
      x.attr('fill','#eaf2f7');
      y.attr('fill','#eaf2f7');
      counter += step;
    }

    // оси
    var X = board.line(offset, step*(points/2)+offset, width+offset, step*(points/2)+offset);
    var Y = board.line(step*(points/2)+offset, offset, step*(points/2)+offset, width+offset);
    var axis = new Snap.Set([X,Y]);
    axis.attr({'stroke':'#576d7f','stroke-width':1});

    // декартовы координаты пунктов назначения
    destinations = [
      {n:1,x:step*(points/2)+offset - (width/2), y:width+offset - (width/2),count:0},
      {n:2,x:width+offset - (width/2), y:step*(points/2)+offset - (width/2),count:0},
      {n:3,x:offset - (width/2), y:step*(points/2)+offset- (width/2),count:0},
      {n:4,x:step*(points/2)+offset - (width/2), y:offset - (width/2),count:0},
      {n:5,x:width+offset - (width/2), y:offset - (width/2),count:0},
      {n:6,x:offset - width/2, y:(width+offset) - width/2,count:0},
      {n:7,x:(width+offset) - width/2, y:(width+offset) - width/2,count:0},
      {n:8,x:offset - width/2, y:offset - width/2,count:0}
    ];

    // точки назначения
    var pRad = 3;
    var p1 = board.circle(step*(points/2)+offset, width+offset, pRad);
    var p2 = board.circle(width+offset, step*(points/2)+offset, pRad);
    var p3 = board.circle(offset, step*(points/2)+offset, pRad);
    var p4 = board.circle(step*(points/2)+offset, offset, pRad);
    var p5 = board.circle(width+offset, offset, pRad);
    var p6 = board.circle(offset, width+offset, pRad);
    var p7 = board.circle(width+offset, width+offset, pRad);
    var p8 = board.circle(offset, offset, pRad);

    var set = new Snap.Set([p1,p2,p3,p4,p5,p6,p7,p8]);
    set.attr({'fill':'#15354f'});
    set.animate({r:15},3000, mina.elastic);


    var p1 = drawLine(
      [ step*(points/2)+offset, step*(points/2)+offset,
        step*(points/2)+offset + step, step*(points/2)+offset,
        step*(points/2)+offset + step, step*(points/2-1)+offset
      ]);
    // var p2 = board.line(step*(points/2)+offset, step*(points/2)+offset,step*(points/2)+offset, step*(points/2)+offset);
    // var lines = new Snap.Set([p1,p2])
    // lines.attr({'stroke-width':2})
    // p1.attr('stroke','blue').animate({x2:step*(points/2)+offset + step*3, y2:step*(points/2)+offset}, 2000, mina.bounce);
    // p2.attr('stroke','black').animate({x2:step*3, y2:step*(points/2)+offset}, 2000, mina.bounce)

    function drawLine(points){
      var c = board.line();
      c.attr({'fill':'red'})
        .animate({x:points[4],y:points[5]}, 500, mina.easeinout);

      return c;
    }
  }


  function start(){
      var Point = function(posX, posY, step){
        this._x = posX || 0;
        this._y = posY || 0;
        this._step = step;
        this._path = [this._x, this._y];
        this.onEdge = null;
      };

      Point.prototype.stepUp = function(){
        this._y += this._step;
        this._updatePath();
      };

      Point.prototype.stepDown = function(){
        this._y -= this._step;
        this._updatePath();
      };

      Point.prototype.stepLeft = function(){
        this._x -= this._step;
        this._updatePath();
      };

      Point.prototype.stepRight = function(){
        this._x += this._step;
        this._updatePath();
      };

      Point.prototype.getPos = function(){
        return {x:this._x, y: this._y}
      };

      Point.prototype.getPath = function(){
        return this._path;
      };

      Point.prototype._updatePath = function(){
        this._path.push(this._x, this._y);
      };

      Point.prototype.randomStep = function(){
        var luckyNum = Math.floor(Math.random()*10);

        switch(this.onEdge) {
          case null: freeMove.call(this,luckyNum);
            break;
          case 'x': verticalMove.call(this,luckyNum);
            break;
          case 'y': horizontalMove.call(this,luckyNum);
        }

        function freeMove(luckyNum) {
          if(luckyNum == 2) {
            this.stepUp();
          } else if(luckyNum == 4) {
            this.stepDown();
          } else if(luckyNum == 6) {
            this.stepLeft();
          } else if(luckyNum == 8) {
            this.stepRight();
          }
        }

        function horizontalMove(luckyNum) {
          if(luckyNum < 5) {
            this.stepLeft();
          } else {
            this.stepRight();
          }
        }

        function verticalMove(luckyNum) {
          if(luckyNum < 5) {
            this.stepUp();
          } else {
            this.stepDown();
          }
        }
      };

      var dotsCount = 20;
      var finished = [];
      var stack = [];

      // создаем 100 точек
      for(var i = 0; i < dotsCount; i++) {
        stack.push(new Point(0,0,step));
      }

      // отправляем их в свободное движение
      while(finished.length < dotsCount) {
        stack.forEach(function(point, index, arr){
          point.randomStep();

          var curPos = point.getPos();

          destinations.forEach(function (dest) {
            if(curPos.x == dest.x && curPos.y == dest.y) {
              finished.push(point);
              dest.count += 1;
              delete arr[index];
            } else if(curPos.x == dest.x &&  curPos.x != 0) {
              point.onEdge = "x";
            } else if(curPos.y == dest.y && curPos.y != 0) {
              point.onEdge = "y";
            }
          });
        })
      }


      var path = finished[0].getPath();
      var d = "M"+width/2+" "+width/2;
      // var p = board.path(d);

      function animatePath(ball, path, counter) {
        // console.log(path.length, counter);
        ball.animate({
          cx:path[counter]+width/2,
          cy:path[counter+1]+width/2,
          x:path[counter]+width/2,
          y:path[counter+1]+width/2,
        },200,mina.elastic, function(){
          if(counter < path.length-3) {
            // console.log(ball.attr('cx'),ball.attr('cx'))
            counter += 2;
            animatePath(ball, path, counter);
          } else {
            console.log(ball.attr('cx'),ball.attr('cx'))
            ball.animate({r:25},200, mina.easeinout, function () {
              ball.animate({r:15},200, mina.easeout, function () {
                ball.remove();
              })
            })
          }
        });
      }

      finished.forEach(function (dot) {
        var ball = board.circle(width/2,width/2,3).attr({fill:'red'});
        var counter = 2;
        var path = dot.getPath();
        animatePath(ball,path,counter);
      });

      window.stack = stack;
      window.fin = finished;
      window.dest = destinations;
  }

  drawBoard(board,10);
  start();
})();