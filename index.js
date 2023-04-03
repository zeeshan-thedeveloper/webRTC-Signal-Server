const express = require("express");
const cors = require("cors");
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
  socket.on("message", (data) => {
    console.log(data);
    io.to(socket.id).emit("response", "You are connected to socket");
  });
  socket.on("getCallId", (data) => {
    console.log(`Received getCallId request from ${socket.id}`);

    // Generate a new call ID (you can use a UUID library here)
    const callId = Math.floor(Math.random() * 1000000).toString();

    // Send the call ID back to the socket that made the request
    socket.emit("sentCallId", { callId });

    console.log(`Sent callId ${callId} to ${socket.id}`);
  });

  socket.on("initiate-call", ({ userName, callId, offer }, callback) => {
    console.log(
      `Received call initiation request from ${userName} for call ${callId}.`
    ,offer);

    // Perform the necessary actions for call initiation, such as creating a new call object, sending call invitations, etc.

    // Once the actions are performed, emit the call status back to the client.
    const callStatus = {
      success: true,
      message: `Call initiated for ${callId}.`,
      // You can also include any other relevant information in the call status object.
    };
    callback(callStatus);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
