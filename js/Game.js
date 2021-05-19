'use strict'
//Need to:
/*
1) The difference between win and loose needs to be sharpend.
*/

const MINE = '💥';
const FLAG = '🚩';
const NORMAL_SMILY = '😃';
const DEAD_SMILY = '😵';
const VICTORY_SMILY = '😎';

var gBoard;
var gLevel = {
    size: 8,
    mines: 12
};

var gGame;
var gTimeInterval;


function initGame() {
    initilizeGameObject();
    renderTime();
    renderLives();
    gBoard = buildBoard();

    renderBoard(gBoard);
    console.log(gBoard);

}

function initilizeGameObject() {
    gGame = {
        isOn: true,
        lives: 3,
        shownCount: 0,
        markedCount: 0,
        secsPasssed: 0
    };

}

function buildBoard() {
    var board = [];
    for (var i = 0; i < gLevel.size; i++) {
        board.push([]);
        for (var j = 0; j < gLevel.size; j++) {
            var newCell = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            };

            board[i][j] = newCell;

        }
    }
    return board;
}

function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var cellId = 'cell-' + i + '-' + j;
            strHTML += `<td id="${cellId}" class="cell"
            onclick="cellClicked(this,${i},${j})"
            oncontextmenu="cellMarked(event,this)"></td>`;
        }
        strHTML += '</tr>';
    }
    var elContainer = document.querySelector('.board');
    elContainer.innerHTML = strHTML;
}

function plantMines(board) {
    var emptyCells = getEmptyCells(board);
    if (!emptyCells.length) return;
    emptyCells = shuffle(emptyCells);

    for (var i = 0; i < gLevel.mines; i++) {
        var location = emptyCells.pop();
        board[location.i][location.j].isMine = true;
    }

}

function changeLevel(elBtn) {
    var boardSize = +elBtn.getAttribute('data-size');
    if (isNaN(boardSize)) return;
    gLevel.size = boardSize;
    switch (gLevel.size) {
        case 4:
            gLevel.mines = 2;
            break;
        case 8:
            gLevel.mines = 12;
            break;
        case 12:
            gLevel.mines = 30;
            break;
        default:
            return;
    }
    setGameOver();
    initGame();
}

function getEmptyCells(board) {
    var emptyCells = [];
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j];
            if (!currCell.isShown && !currCell.isMarked) {
                emptyCells.push({ i, j });
            }
        }
    }

    return emptyCells;


}

function startTime() {
    if (!gTimeInterval) {

        gTimeInterval = setInterval(function() {
            gGame.secsPasssed++;
            renderTime();
        }, 1000)
    } else return;
}


function renderTime() {
    document.querySelector('.time span').innerText = gGame.secsPasssed;
}

function renderLives() {
    document.querySelector('.lives span').innerText = gGame.lives;
}


//Getting the cell itself, the row index and the col index of the cell
function cellClicked(elCell, i, j) {
    if (!gGame.isOn) return;
    var cell = gBoard[i][j];
    if (cell.isShown || cell.isMarked) return;
    var cellLocation = { i, j };
    startTime();
    if (cell.isMine) {
        elCell.classList.add('explosion');
        setGameOver();
        return;
    }
    cell.isShown = true;

    //After first click the mines will be deployed.
    if (gGame.shownCount === 0) {
        plantMines(gBoard);
        setMinesNegsCount(gBoard);
    }

    var cellContent = (cell.isMine) ? MINE : cell.minesAroundCount;
    if (cell.minesAroundCount === 0) {
        expandShown(gBoard, elCell, cellLocation);
    } else {
        elCell.classList.add('shown');
        elCell.innerText = cellContent;
    }
    gGame.shownCount++;
    checkGameOver(gBoard);
}

function expandShown(board, elCell, location) {
    elCell.classList.add('shown');
    elCell.innerText = '';
    var locationsNegs = getNegs(board, location.i, location.j);
    for (var i = 0; i < locationsNegs.length; i++) {
        var currLocation = locationsNegs[i];
        var currCell = board[currLocation.i][currLocation.j];
        if (!currCell.isShown) {
            var currElCell = getElCell(currLocation);
            var cellContent = (currCell.minesAroundCount) > 0 ? currCell.minesAroundCount : '';
            currElCell.innerText = cellContent;
            currElCell.classList.add('shown');
            currCell.isShown = true;
            gGame.shownCount++;
        }
    }
}

function cellMarked(ev, elCell) {
    ev.preventDefault();

    if (!gGame.isOn) return;
    var location = getCellLocation(elCell.id);
    if (!location) return;
    var cell = gBoard[location.i][location.j];
    if (cell.isShown) return;
    startTime();
    var cellContent = cell.isMarked ? '' : FLAG;
    elCell.innerText = cellContent;
    cell.isMarked = !cell.isMarked;
    if (cell.isMarked) gGame.markedCount++;
    else gGame.markedCount--;
    checkGameOver(gBoard);

}

// location such as: {i: 2, j: 7}
function renderCell(location, value) {
    // Select the elCell and set the value
    var selector = getSelector(location);
    var elCell = document.querySelector(selector);
    elCell.innerText = value;
}

function getCellLocation(cellIdStr) {
    var parts = cellIdStr.split('-');
    var i = +parts[1];
    var j = +parts[2];

    if (!isNaN(i) && !isNaN(j)) {
        var location = { i, j };
        return location;
    }
    return null;
}

function getNegs(board, rowIdx, colIdx) {
    var negs = [];
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > board[0].length - 1) continue;
            if (i === rowIdx && j === colIdx) continue
            var location = { i, j };
            negs.push(location);

        }
    }
    return negs;
}


function getCellMinesCount(board, locations) {
    var minesCount = 0;
    for (var i = 0; i < locations.length; i++) {
        var location = locations[i];
        var cell = board[location.i][location.j];
        if (cell.isMine) minesCount++;
    }
    return minesCount;
}


function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j];
            var locationsNegs = getNegs(board, i, j);
            currCell.minesAroundCount = getCellMinesCount(board, locationsNegs);
        }
    }
}
//Should be called checkWin
function checkGameOver(board) {
    //Number of flagged cells needs to be equal to number of mines
    if (gGame.markedCount !== gLevel.mines) return;
    //Number of shown cells needs to be equal to number of all cells minos mines
    if (gGame.shownCount !== ((gLevel.size ** 2) - gLevel.mines)) return;
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j];
            if (currCell.isMine && !currCell.isMarked) return;
        }
    }
    console.log('win!');
    setGameOver();
}

function setGameOver() {
    gGame.isOn = false;
    clearInterval(gTimeInterval);
    gTimeInterval = null;
    revealMines(gBoard);
}

function revealMines(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j];
            if (!currCell.isMine) continue;
            currCell.isShown = true;
            var elCell = getElCell({ i, j });
            elCell.innerText = MINE;
            if (!elCell) return;
            if (currCell.isMarked) {
                if (elCell) elCell.classList.add('defused');
            }
        }
    }
}

function getElCell(location) {
    var selector = getSelector(location);
    var elCell = document.querySelector(selector);
    return elCell;
}