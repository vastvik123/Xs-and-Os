class Turn{
    #enable = false;
    #room = null;
    #sign = null;
    #board = [1,2,3,4,5,6,7,8,9];
    getEnable(){
        return this.#enable;
    }
    changeEnable(){
        if(this.#enable == false)
        this.#enable = true;
        else
        this.#enable = false;
    }
    setRoom(id){
        if(this.#room == null){
            this.#room = id;
        }
    }
    getRoom(){
        return this.#room;
    }
    setSign(x){
        if(this.#sign == null){
            this.#sign = x;
        }
    }
    getSign(){
        return this.#sign;
    }
    setBoard(grid){
        this.#board = grid;
    }
    getBoard(){
        return this.#board;
    }

}

var my = new Turn();
const socket = io();
document.getElementById("rematch").setAttribute("disabled","disabled");
var url = new URL(window.location.href);

if(url.searchParams.get('create')){
 //console.log("created");
 socket.emit("createRoom");
 my.setSign('X');
 socket.on('roomCreated',(roomId) => {
    //console.log("Room Id is: " + roomId);
    my.setRoom(roomId);
    document.getElementById('header').innerHTML = 'Room Created! Waiting for Opponent...';
 });

}

else if(url.searchParams.get('roomId')){
    //console.log("joined");
    socket.emit("joinRoom",url.searchParams.get('roomId'));
    socket.on("roomJoined", id => {
        //console.log("Room joined is: " + id);
        my.setRoom(id);
        my.setSign('O');
        document.getElementById('header').innerHTML = "Oponents's turn!!!";
    });

}

else{
    alert('Wrong Room');
    location.replace('http://localhost:3000');
}


function fill(id) {
    var game = my.getBoard();
    var pre = false;
    for(var i=0;i<game.length;i++){
        if(game[i] == id){
            pre = true;
            break;
        }
    }

    if(my.getEnable() && pre){
        document.getElementById(id).innerHTML = my.getSign();
        my.changeEnable();
        roomId = my.getRoom();
        //console.log({roomId,id});
        var temp = my.getBoard();
        temp.splice(temp.indexOf(parseInt(id)),1);
        my.setBoard(temp);
        socket.emit("turnComplete", {roomId,id});
        document.getElementById('header').innerHTML = "Opponent's turn!!!"
    }
  
}

socket.on("wrongRoom", () => {
    alert('Wrong Room');
    location.replace('http://localhost:3000');
});

socket.on('yourTurn',(grid) => {
    //console.log("Your turn");
    //console.log(grid);
    var temp = my.getBoard();
    
    for(var i=0;i<temp.length;i++){
        var ch = false;
        for(var j=0;j<grid.length;j++){
            if(temp[i] == grid[j]){
                ch = true;
                break;
            }
        }
        if(ch == false){
            if(my.getSign() == 'X'){
                document.getElementById(temp[i]).innerHTML = 'O';
            }
            else{
                document.getElementById(temp[i]).innerHTML = 'X';
            }
            break;
        }
    }
    my.setBoard(grid);
    document.getElementById('header').innerHTML = "Your turn!!!";
    my.changeEnable();

});

socket.on("gameOver", () =>{
    //console.log("Game over!");
    var temp = my.getBoard();
    if(my.getSign() == 'X' && temp.length>0){
        document.getElementById(temp[0]).innerHTML = 'O';
    }
    else if(temp.length>0){
        document.getElementById(temp[0]).innerHTML = 'X';
    }
    document.getElementById("rematch").removeAttribute("disabled");
});

socket.on("youWon", () => {
    //console.log("You won");
    document.getElementById('header').innerHTML = "You Won!!!";
    document.getElementById("rematch").removeAttribute("disabled");
});

socket.on("youLost", (current) => {
    var temp = my.getBoard();
    
    for(var i=0;i<temp.length;i++){
        var ch = false;
        for(var j=0;j<current.length;j++){
            if(temp[i] == current[j]){
                ch = true;
                break;
            }
        }
        if(ch == false){
            if(my.getSign() == 'X'){
                document.getElementById(temp[i]).innerHTML = 'O';
            }
            else{
                document.getElementById(temp[i]).innerHTML = 'X';
            }
            break;
        }
    }
    //console.log("You Lost");
    document.getElementById('header').innerHTML = "You Lost!!!";
    document.getElementById("rematch").removeAttribute("disabled");
});

socket.on("opponentLeft", () => {
    alert("opponent Disconnected");
    location.replace("http://localhost:3000");
});

function rematch(){
    var room = my.getRoom();
    socket.emit("rematch",room);
}

socket.on("wantRematch", () => {
    var room = my.getRoom();
    if (confirm('Do you want a rematch?')) {
        socket.emit('rematchAccepted',room);
        for(var i=1;i<=9;i++){
            var temp = document.getElementById(i);
            temp.innerHTML = "";
        }
        my.setBoard([1,2,3,4,5,6,7,8,9]);
        document.getElementById("rematch").setAttribute("disabled","disabled");
        document.getElementById("header").innerHTML = "Opponent's turn!!!";
      }
    else {
        socket.emit("rematchRejected",room);
        location.replace("http://localhost:3000");
    }
});

socket.on("rematchAccepted", room => {
    for(var i=1;i<=9;i++){
        var temp = document.getElementById(i);
        temp.innerHTML = "";
    }
    document.getElementById("rematch").setAttribute("disabled","disabled");
    my.setBoard([1,2,3,4,5,6,7,8,9]); 
});

socket.on("rematchRejected", room => {
    alert("rematch rejected");
    location.replace("http://localhost:3000");
})