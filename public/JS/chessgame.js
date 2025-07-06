const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + colIndex) % 2 === 0 ? "light" : "dark");
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = colIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: colIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => e.preventDefault());

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === "b") {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q",
    };

    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicode = {
        p: "♟️", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
        P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
    };
    return piece.color === "w" ? unicode[piece.type.toUpperCase()] : unicode[piece.type];
};

socket.on("playerRole", function (role) {
    playerRole = role;
    console.log("You are player:", role);
    renderBoard();
});

socket.on("spectatorRole", function () {
    playerRole = null;
    alert("You are a spectator. Only two players can play.");
    renderBoard();
});

socket.on("boardState", function (fen) {
    chess.load(fen);
    renderBoard();
});
