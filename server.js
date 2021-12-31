const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const moment = require("moment");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "views")));
app.use(express.urlencoded({ extended: true }));

const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => {
  console.log(`ON PORT ${PORT}`);
});

const privateRooms = [];
const randomRooms = [];

function getUsersInThisPrivateRoom(roomid) {
  for (let room of privateRooms) {
    if (room.roomid == roomid) {
      return room.users;
    }
  }
}

function removeUserFromThisPrivateRoom(roomid, userid) {
  for (let room of privateRooms) {
    if (room.roomid == roomid) {
      for (let user of room.users) {
        if (user.id == userid) {
          room.users.splice(room.users.indexOf(user), 1);
          if (room.users.length == 0) {
            privateRooms.splice(privateRooms.indexOf(room), 1);
          }
          break;
        }
      }
      break;
    }
  }
}

function getUsersInThisRandomRoom(roomid) {
  for (let room of randomRooms) {
    if ((room.roomid = roomid)) {
      return room.users;
    }
  }
}

function removeUserFromThisRandomRoom(roomid, userid) {
  for (let room of randomRooms) {
    if (room.roomid == roomid) {
      for (let user of room.users) {
        if (user.id == userid) {
          room.users.splice(room.users.indexOf(user), 1);
          if (room.users.length == 0) {
            randomRooms.splice(randomRooms.indexOf(room), 1);
          }
          break;
        }
      }
      break;
    }
  }
}

io.on("connection", (socket) => {
  socket.on("type", (data) => {
    if (data.type == "privateChat") {
      socket.data = data;
      socket.join(data.roomid);

      socket.emit("welcome", socket.data.username, moment().format("h:mm a"));

      socket.broadcast
        .to(data.roomid)
        .emit("newUser", socket.data.username, moment().format("h:mm a"));

      const joinedUsersList = [];
      const users = getUsersInThisPrivateRoom(socket.data.roomid);
      for (let user of users) {
        joinedUsersList.push(user.name);
      }

      io.to(socket.data.roomid).emit("joinedUsersList", joinedUsersList);
    }
  });

  socket.on("message", (msg) => {
    io.to(socket.data.roomid).emit("message", {
      username: socket.data.username,
      message: msg,
      time: moment().format("h:mm a"),
    });
  });

  //******************Random Rooms Socket******************** */
  socket.on("rr_userDetails", (username, userid, roomid) => {
    socket.data = {
      username,
      userid,
      roomid,
    };
    socket.join(socket.data.roomid);

    socket.emit("rr_welcome", socket.data.username, moment().format("h:mm a"));

    socket.broadcast
      .to(socket.data.roomid)
      .emit(
        "rr_displayUserJoined",
        socket.data.username,
        moment().format("h:mm a")
      );

    const joinedUsersList = [];
    for (let room of randomRooms) {
      if (room.roomid == socket.data.roomid) {
        for (let user of room.users) {
          joinedUsersList.push(user.name);
        }
        break;
      }
    }
    io.to(socket.data.roomid).emit("rr_joinedUsersList", joinedUsersList);
  });

  socket.on("rr_messageCtoS", (message) => {
    io.to(socket.data.roomid).emit(
      "rr_messageStoC",
      socket.data.username,
      message,
      moment().format("h:mm a")
    );
  });

  socket.on("disconnect", () => {
    if (socket.data.type == "privateChat") {
      removeUserFromThisPrivateRoom(socket.data.roomid, socket.data.userid);
      const joinedUsersList = [];
      const users = getUsersInThisPrivateRoom(socket.data.roomid);
      if (users) {
        for (let user of users) {
          joinedUsersList.push(user.name);
        }
      }
      socket.broadcast
        .to(socket.data.roomid)
        .emit("joinedUsersList", joinedUsersList);
      socket.broadcast
        .to(socket.data.roomid)
        .emit("userLeft", socket.data.username, moment().format("h:mm a"));
    } else {
      removeUserFromThisRandomRoom(socket.data.roomid, socket.data.userid);
      const joinedUsersList = [];
      const users = getUsersInThisRandomRoom(socket.data.roomid);
      if (users) {
        for (let user of users) {
          joinedUsersList.push(user.name);
        }
      }
      socket.broadcast
        .to(socket.data.roomid)
        .emit("rr_joinedUsersList", joinedUsersList);

      socket.broadcast
        .to(socket.data.roomid)
        .emit(
          "rr_displayUserLeft",
          socket.data.username,
          moment().format("h:mm a")
        );
    }
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/private_chat", (req, res) => {
  res.render("privateChat", { error: "" });
});

app.post("/private_chat/:type", (req, res) => {
  const { type } = req.params;
  if (type == "newchat") {
    const { username } = req.body;
    const user = {
      name: username,
      id: uuidv4(),
    };
    const newRoom = {
      roomid: uuidv4(),
      users: [user],
    };
    privateRooms.push(newRoom);
    res.redirect(`/private_chat/${newRoom.roomid}/${user.id}`);
  } else if (type == "joinwithid") {
    const { id } = req.body;
    let foundRoom = false;
    for (let room of privateRooms) {
      if (room.roomid == id) {
        foundRoom = true;
        const { username } = req.body;
        const user = {
          name: username,
          id: uuidv4(),
        };
        room.users.push(user);
        res.redirect(`/private_chat/${room.roomid}/${user.id}`);
        break;
      }
    }
    if (foundRoom == false) {
      res.render("privateChat", { error: "Invalid ID" });
    }
  } else {
    res.redirect("*");
  }
});

app.get("/private_chat/:roomid/:userid", (req, res) => {
  const { roomid, userid } = req.params;
  let found = false;
  let username = "";
  for (let room of privateRooms) {
    if (room.roomid == roomid) {
      const roomUsers = room.users;
      for (let user of roomUsers) {
        if (user.id == userid) {
          found = true;
          username = user.name;
          break;
        }
      }
      break;
    }
  }
  if (found == true) {
    res.render("privateChatInterface", {
      roomid: roomid,
      userid: userid,
      username: username,
    });
  } else {
    res.send("<h1>Invalid Room ID or User ID</h1>");
  }
});


app.post("/randomroom", (req, res) => {
  const { username } = req.body;
  const newUser = {
    name: username,
    id: uuidv4(),
  };

  //If there are no rooms, create one
  if (randomRooms.length == 0) {
    const newRoom = {
      roomid: uuidv4(),
      users: [newUser],
    };
    randomRooms.push(newRoom);
    res.render("randomRoom", {
      username,
      userid: newUser.id,
      roomid: newRoom.roomid,
    });
    return;
  }

  const toss = Math.floor(Math.random() * 10);

  if (toss < 7) {
    //Randomly select a room and add user to it
    const randomIndex = Math.floor(Math.random() * randomRooms.length);
    randomRooms[randomIndex].users.push(newUser);

    res.render("randomRoom", {
      username,
      userid: newUser.id,
      roomid: randomRooms[randomIndex].roomid,
    });
  } else {
    //Create a new room and add user to it
    const newRoom = {
      roomid: uuidv4(),
      users: [newUser],
    };
    randomRooms.push(newRoom);
    res.render("randomRoom", {
      username,
      userid: newUser.id,
      roomid: newRoom.roomid,
    });
  }
});

app.get("*", (req, res) => {
  res.send("<h1>I don't know that path!</h1>");
});
