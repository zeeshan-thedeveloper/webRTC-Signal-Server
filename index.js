const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("webRTC-Signal-server");
});

const server = app.listen(3000, () => {
  console.log("Server started on port 3000");
});

const io = require("socket.io")(server);

io.on("connection", (socket) => {
    console.log("New user joined socket : "+socket.id)
    socket.on("message", (data) => {
        console.log(data)
        io.to(socket.id).emit("response","You are connected to socket");
    })
})
