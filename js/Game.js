'use strict'


const MINE = '💥';
const FLAG = '🚩';

var gBoard;
var gLevel = {
    size: 4,
    mines: 2
};


function initGame() {
    gBoard = buildBoard();
    renderBoard(gBoard);
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

    board[0][0].isMine = true;
    board[1][1].isMine = true;
    setMinesNegsCount(board);
    console.log(board);
    return board;
}

function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var cell = board[i][j];
            var cellId = 'cell-' + i + '-' + j;
            var cellContent = '';
            if (cell.isShown) {
                cellContent = (cell.isMine) ? MINE : cell.minesAroundCount;
            }
            strHTML += `<td id="${cellId}" class="cell"
            onclick="cellClicked(this,${i},${j})"
            oncontextmenu="cellMarked(event,this)">${cellContent}</td>`;
        }
        strHTML += '</tr>';
    }
    var elContainer = document.querySelector('.board');
    elContainer.innerHTML = strHTML;
}
//Getting the cell itself, the row index and the col index of the cell
function cellClicked(elCell, i, j) {
    var cell = gBoard[i][j];
    var cellContent = (cell.isMine) ? MINE : cell.minesAroundCount;
    renderCell(elCell, cellContent)
}

function cellMarked(ev, elCell) {
    ev.preventDefault();
    renderCell(elCell, FLAG);
}

// location such as: {i: 2, j: 7}
function renderCell(elCell, value) {
    // Select the elCell and set the value
    elCell.innerHTML = value;
}

function getCellMinesCount(board, rowIdx, colIdx) { // 4 , 0
    var minesCount = 0;
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) { // 3 4 5
        if (i < 0 || i > board.length - 1) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > board[0].length - 1) continue;
            if (i === rowIdx && j === colIdx) continue
            var cell = board[i][j];
            if (cell.isMine) minesCount++;

        }
    }
    return minesCount;

}


function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j];
            currCell.minesAroundCount = getCellMinesCount(board, i, j);
        }
    }

}