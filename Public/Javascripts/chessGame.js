const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.board');


let draggedPeice = null
let playRole = null
let sourceSquare = null


// Dark mode toggle

function handleDarkMode() {
    const body = document.querySelector('body');
    const header = document.querySelector('header');
    body.classList.toggle('dark');
    header.classList.toggle('dark');
}


// Theme toggler


const changePieceColor = (theme) => {
    let color = '#000'; 
    if (theme === "black") color = '#595959'; 
    document.querySelectorAll('.piece.black').forEach(el => {
        el.style.color = color;
    });
    console.log("first")
}


const dropdownItems = document.querySelectorAll(".dropdown-item");
const themeDropdownButton = document.getElementById("themeDropdownButton");

dropdownItems.forEach(item => {
    item.addEventListener("click", function (e) {
        e.preventDefault();

        const selectedTheme = this.textContent.trim().toLowerCase();

        // Optionally update button text
        if (themeDropdownButton) {
            themeDropdownButton.textContent = this.textContent;
        }

        if (selectedTheme === "default") {
            document.documentElement.style.setProperty('--defaultThemeDark', '#b58863');
            document.documentElement.style.setProperty('--defaultThemeLight', '#f0d9b5');

        } else if (selectedTheme === "black") {
            document.documentElement.style.setProperty('--defaultThemeDark', 'black');
            document.documentElement.style.setProperty('--defaultThemeLight', 'white');
        } else if (selectedTheme === "blue") {
            document.documentElement.style.setProperty('--defaultThemeDark', '#4b7399');
            document.documentElement.style.setProperty('--defaultThemeLight', '#b0d4e8');

        } else if (selectedTheme === "green") {
            document.documentElement.style.setProperty('--defaultThemeDark', '#789758');
            document.documentElement.style.setProperty('--defaultThemeLight', '#eeeed3');

        }
        renderBoard();
        changePieceColor(selectedTheme);
    });
});



const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = '';
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add(
                'square',
                (rowIndex + squareIndex) % 2 === 0 ? 'light' : 'dark'
            );

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;
            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    'piece',
                    square.color === 'w' ? 'white' : 'black',
                );
                pieceElement.innerHTML = getPieceUnicode(square)
                pieceElement.draggable = square.color === playRole
                pieceElement.addEventListener('dragstart', (e) => {
                    if (pieceElement.draggable) {
                        draggedPeice = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData('text/plain', ``);
                    }
                })

                pieceElement.addEventListener('dragend', () => {
                    draggedPeice = null;
                    sourceSquare = null;
                })
                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedPeice) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    }
                    handleMove(sourceSquare, targetSource)
                }
            });


            boardElement.appendChild(squareElement);
        })

    })
    if (playRole == "b") {
        boardElement.classList.add('flipped');
        document.getElementById("playerColor").textContent = "Black";
    }
    else {
        boardElement.classList.remove('flipped');
        document.getElementById("playerColor").textContent = "White";
    }
};


const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    };

    socket.emit("move", move);
}


const getPieceUnicode = (piece) => {
    if (!piece || !piece.type || !piece.color) return '';

    const pieceUnicode = {
        p: { w: '♙', b: '♟' },
        r: { w: '♖', b: '♜' },
        n: { w: '♘', b: '♞' },
        b: { w: '♗', b: '♝' },
        q: { w: '♕', b: '♛' },
        k: { w: '♔', b: '♚' }
    };

    const type = piece.type.toLowerCase();
    const color = piece.color.toLowerCase();

    return pieceUnicode[type]?.[color] || '';
};


// Handling socket events


socket.on("playRole", (role) => {
    playRole = role;
    renderBoard()
})


socket.on("Spectator", (role) => {
    playRole = null;
    renderBoard()
})


socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard()
})





socket.on("move", (move) => {
    chess.move(move);
    renderBoard()
})


socket.on("error", (message) => {
    Toastify({
        text: message,
        className: "info",
        style: {
            background: "linear-gradient(to right,rgb(176, 41, 0),rgb(242, 73, 0))",
        }
    }).showToast();
});


socket.on("left", (message) => {
    console.log("first")
    renderBoard()
    // console.log(message);
    // Toastify({
    //     text: message,
    //     className: "info",
    //     style: {
    //         background: "linear-gradient(to right,rgb(176, 41, 0),rgb(242, 73, 0))",
    //     }
    // }).showToast();
})

renderBoard()