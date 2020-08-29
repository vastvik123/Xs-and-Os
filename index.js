const express = require("express");
const dotenv = require("dotenv");
const socketio = require("socket.io");
const http = require("http");
const path = require("path");

dotenv.config();

const PORT = process.env.PORT  || 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "public")));

//win combos
winners = [
  [1,2,3],
  [4,5,6],
  [7,8,9],
  [1,4,7],
  [2,5,8],
  [3,6,9],
  [1,5,9],
  [3,5,7]
]

//All the rooms
const rooms = [];
var currentRoom = 0;

const games = [];
const users = [];

//socket event handler
io.on("connection", (socket) => {

  socket.on("createRoom",() => {
    
    rooms.push(currentRoom);
    socket.join(currentRoom);
    console.log(rooms);
    
    const user = {
      id : socket.id,
      room: currentRoom,
      moves : []
    }
    users.push(user);
    socket.emit('roomCreated',currentRoom);
    currentRoom++;
  });

  //joining a room
  socket.on("joinRoom", (roomId) => {
    
    if (rooms.includes(parseInt(roomId))) {
      console.log("room joined");
      const user = {
        id : socket.id,
        room : roomId,
        moves : []
      }
      users.push(user);
      socket.join(parseInt(roomId));
      rooms.splice(rooms.indexOf(parseInt(roomId)), 1);

      var game = {
        room : parseInt(roomId),
        grid : [1,2,3,4,5,6,7,8,9]
      }
      games.push(game);
      socket.emit("roomJoined",roomId);
      
      var current;
      for(var i=0;i<games.length;i++){
        if(games[i].room == parseInt(roomId)){
          current = games[i].grid;
          break;
        }
      }
      socket.broadcast.to(parseInt(roomId)).emit('yourTurn',current);
      console.log("Game started");
    } 
    else {
      console.log("wrong Room");
      socket.emit("wrongRoom");
    }
  });

  socket.on('turnComplete', ({roomId,id}) => {
    console.log("turn complete!!!");
    var pos;
    for(var i=0;i<users.length;i++){
      if(socket.id == users[i].id){
        pos = i;
        (users[i].moves).push(parseInt(id));
        break;
      }
    }
    console.log(roomId);
    console.log(id);
    var current;
    for(var i=0;i<games.length;i++){
      if(games[i].room == parseInt(roomId)){
        games[i].grid.splice((games[i].grid).indexOf(parseInt(id)),1);
        current = games[i].grid;
        break;
      }
    }
    console.log(current);
    if(users[pos] != undefined && pos != undefined)
    var check = checkWin(users[pos].moves);

    if(check){
      console.log("game over");
      socket.emit("youWon");
      socket.broadcast.to(parseInt(roomId)).emit("youLost",current);
    }

    else if(current.length > 0){
      console.log(current.length);
      socket.broadcast.to(parseInt(roomId)).emit("yourTurn",current);
    }
    
    else{
      console.log("game over");
      io.in(parseInt(roomId)).emit("gameOver");
    }
    
  });
  
  socket.on('rematch', (room) => {
    for(var i=0;i<users.length;i++){
      if(socket.id == users[i].id){
        users[i].moves = [];
        break;
      }
    }
    socket.broadcast.to(room).emit("wantRematch");
  });

  socket.on('rematchAccepted',room => {
    for(var i=0;i<users.length;i++){
      if(socket.id == users[i].id){
        users[i].moves = [];
        break;
      }
    }
    socket.broadcast.to(room).emit("rematchAccepted");
    for(var i=0;i<games.length;i++){
      if(games[i].room == room){
        games[i].grid = [1,2,3,4,5,6,7,8,9];
        break;
      }
    }
    socket.broadcast.to(parseInt(room)).emit("yourTurn",[1,2,3,4,5,6,7,8,9]);
    
  });
  socket.on("rematchRejected", room => {
    socket.broadcast.to(room).emit("rematchRejected");
  })
  
  socket.on('disconnect', () => {
    console.log(socket.id + " disconnected");
    var pos;
    var roomNo;
    for(var i=0;i<users.length;i++){
      if((users[i].id) == socket.id){
        pos = i;
        roomNo = users[i].room;
        break;
      }
    }
    users.splice(pos,1);

    for(var i=0;i<users.length;i++){
      if(users[i].room == roomNo){
        pos = i;
        break;
      }
    }
    console.log(pos);
    if(pos != undefined && users[pos] != undefined){
      io.to(users[pos].id).emit("opponentLeft");
      users.splice(pos,1);
    }
    
    for(var i=0;i<games.length;i++){
      if(games[i].p1 == socket.id){
        pos = i;
        id = games[i].p2;
        break;
      }
      else if(games[i].p2 == socket.id){
        pos = i;
        id = games[i].p1;
        break;
      }
    }
    games.splice(pos,1);
    
  });

});

function checkWin(arr){
  if(arr.length < 3) return false;

  arr.sort();
  console.log(arr);
  
  var win = false;
    
  for (var i = 0; i < winners.length; i++) {
    var sets = winners[i];  // winning hand
    var setFound = true;
    
    for (var r = 0; r < sets.length; r++) {
        // check if number is in current players hand
        // if not, break, not winner
        var found = false;
        
        // players hand
        for (var s = 0; s < arr.length; s++) {
            if (sets[r] == arr[s]) {
                found = true;
                break;
            }
        }

        // value not found in players hand
        // not a valid set, move on
        if (found == false) {
            setFound = false;
            break;
        }
    }

    if (setFound == true) {
        win = true;
        break;
    }
  }
  
  return win;
} 
  


server.listen(PORT, () => console.log(`server running on ${PORT}`));
