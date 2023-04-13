const express = require("express");
const cors = require("cors");
const { storageManager } = require("./storage-manager/storage-manager");
let localStorageManager = storageManager();
const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("webRTC-Signal-server");
});

const server = app.listen(8080, () => {
  console.log("Server started on port 8080");
});

const io = require("socket.io")(server);

io.on("connection", (socket) => {

  console.log("New user joined socket : " + socket.id);
  io.to(socket.id).emit("recieveSocketId", socket.id);
  
  socket.on("startOneToOneCall",({socketId}, callback) => {
    
    const response = {
      success: true,
      message: "Request startOneToOneCall recieved successfully.",
    };

    callback(response)
  })

  socket.on("makeOneToOneCallJoiningRequest",({socketId}, callback) => {
    
    const response = {
      success: true,
      message: "Request makeOneToOneCallJoiningRequest recieved successfully.",
    };

    callback(response)
  })

  socket.on("updateOneToOneCallRequestStatus",({socketId}, callback) => {
    
    const response = {
      success: true,
      message: "Request updateOneToOneCallRequestStatus recieved successfully.",
    };

    callback(response)
  })


  socket.on("startGroupCall",({socketId}, callback) => {
    
    const response = {
      success: true,
      message: "Request startGroupCall recieved successfully.",
    };

    callback(response)
  })


  socket.on("makeGroupCallJoiningRequest",({socketId}, callback) => {
    
    const response = {
      success: true,
      message: "Request makeGroupCallJoiningRequest recieved successfully.",
    };

    callback(response)
  })

  socket.on("updateGroupCallRequestStatus",({socketId}, callback) => {
    
    const response = {
      success: true,
      message: "Request updateGroupCallRequestStatus recieved successfully.",
    };

    callback(response)
  })

  socket.on("joinGroupCall",({socketId}, callback) => {
    
    const response = {
      success: true,
      message: "Request joinGroupCall recieved successfully.",
    };

    callback(response)
  })

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
