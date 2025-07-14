const express = require('express');
const app = express();
const socketIo = require('socket.io');
const http = require('http');
const { Chess } = require("chess.js")
const path = require('path');
const PORT = process.env.PORT || 3000


const server = http.createServer(app);
const io = socketIo(server);

const chess = new Chess()

const players = {};
let currentPlayer = "w";

app.use(express.urlencoded({ extended: true })); 
app.use(express.json()); 
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")))



app.get('/', (req, res) => {
    res.render('index');
});

app.post('/chat', (req, res) => {
    const message = req.body;

    
    io.emit('chat', message,players);

    res.status(200).json({ success: true });
});


io.on("connection", (uniqueSocket) => {
    // Log the connection
    if (!players.white) {
        players.white = uniqueSocket.id;
        uniqueSocket.emit("playRole", "w");
        console.log("White player connected");
    }
    else if (!players.black) {
        players.black = uniqueSocket.id;
        uniqueSocket.emit("playRole", "b");
        console.log("Black player connected");
    }
    else {
        io.emit("playRole", "Spectator");
        console.log("Spectactor Connected");
    }


    // On Move

    uniqueSocket.on("move", (move) => {
        try {
            if (chess.turn() !== currentPlayer) {
                uniqueSocket.emit("error", "It's not your turn");
                return;
            }
            const result = chess.move(move);
            if (!result) {
                uniqueSocket.emit("error", "Invalid move");
                return;
            }
            else {
                io.emit("move", result);
                currentPlayer = chess.turn();
                io.emit("boardState", chess.fen());
            }
        } catch (error) {
            console.error("Error processing move:", error);
            uniqueSocket.emit("error", "Invalid move");
            return;
        }
    })

    // On Disconnect
    uniqueSocket.on("disconnect", () => {
        if (players.white === uniqueSocket.id) {
            delete players.white;
            chess.reset();
            uniqueSocket.emit("left", "White player disconnected");
            console.log("White player disconnected");
        } else if (players.black === uniqueSocket.id) {
            delete players.black;
            chess.reset();
            uniqueSocket.emit("left", "Black player disconnected");
            console.log("Black player disconnected");
        } else {
            console.log("Spectator disconnected");
        }

        if (!players.white && !players.black) {
            chess.reset();
            console.log("Game reset — both players disconnected");
        }
    });

})




server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});