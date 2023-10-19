const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: true,
};

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    console.log(`User ${userId} joined room ${roomId}`);
    
    socket.join(roomId);

    setTimeout(() => {
      const roomSocket = io.sockets.in(roomId);
      if (roomSocket) {
        console.log(`Broadcasting user-connected event to room ${roomId}`);
        roomSocket.emit("user-connected", userId);
      } else {
        console.error(`Socket for room ${roomId} not found`);
      }
    }, 1000);

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
  });
});

server.listen(process.env.PORT || 8080);
console.log("Socket Connected");
