const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess game" });
});

io.on("connection", function (socket) {
    console.log("New connection:", socket.id);

    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("spectatorRole");
    }

    
    socket.on("disconnect", function () {
        if (socket.id === players.white) {
            delete players.white;
        } else if (socket.id === players.black) {
            delete players.black;
        }
    });

   
    socket.on("move", (move) => {
        try {
            const playerColor = socket.id === players.white ? "w" : socket.id === players.black ? "b" : null;
            if (playerColor !== chess.turn()) return;

            const result = chess.move(move);
            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                socket.emit("invalidMove", move);
            }
        } catch (err) {
            console.error("Move error:", err);
            socket.emit("invalidMove", move);
        }
    });
});

server.listen(3000, function () {
    console.log("Server listening on http://localhost:3000");
});
