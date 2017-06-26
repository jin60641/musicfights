function InputSystem(){
	this.isKeyPressed=[];
	return this;
}

var inputSystem=new InputSystem();

InputSystem.prototype.isKeyDown=function(keyCode){
	if(this.isKeyPressed[keyCode]==true){
		return true;
	} else {
		return false;
	}
}

function keyDown(e){
	inputSystem.isKeyPressed[e.keyCode]=true;
	useSkill(e.keyCode);
}

function keyUp(e){
	if(e.keyCode == 9 ){
		e.preventDefault();
	}
        inputSystem.isKeyPressed[e.keyCode]=false;
}

rightClicked = 0;
var mouseX;
var mouseY;
var target;
function mouseDown(e){
	e.preventDefault();
	if( e.button == 2){
		rightClicked = 1;
	} else if( e.button == 0){
		var intX = intY = 0;
		var centerX = canvas.width / 2;
		var centerY = canvas.height / 2;
		if( players[0].x <= centerX ){
			intX = e.clientX;
		} else if( players[0].x >= gameSize - centerX ){
			intX = e.clientX + gameSize - canvas.width;
		} else {
			intX = players[0].x + e.clientX - centerX;
		}
		if( players[0].y <= centerY ){
			intY = e.clientY;
		} else if( players[0].y >= gameSize - centerY ){
			intY = e.clientY + gameSize - canvas.height;
		} else {
			intY = players[0].y + e.clientY - centerY;
		}
		for( var i = players.length - 1; i >= 0; --i ){
			if( intX > players[i].x - players[i].size/2 && intX < players[i].x + players[i].size/2 && intY > players[i].y - players[i].size/2 && intY < players[i].y + players[i].size/2 ){
				target = i;
			}
		}
	}
}

function mouseUp(e){
	e.preventDefault();
	rightClicked = 0;
}

function mouseMove(e){
	e.preventDefault();
	mouseX = e.clientX;
	mouseY = e.clientY;
}


