'use strict'
//Need to:
/*
1) The difference between win and loose needs to be sharpend.
 11am start 
 */
const MINE = '💥';
const FLAG = '🚩';
const NORMAL_SMILEY = '😃';
const DEAD_SMILEY = '😵';
const VICTORY_SMILEY = '😎';
const HINT_UNUSED = 'img/pic_bulboff.gif';
const HINT_USED = 'img/pic_bulbon.gif';

var gBoard;
var gLevel = {
    title: 'Beginner',
    size: 4,
    mines: 2
};
var gGame;
var gTimeInterval;

function initGame() {
    initilizeGameObject();
    renderBestScore();
    renderTime();
    renderLives();
    renderHints();
    gBoard = buildBoard();
    renderBoard(gBoard);
    renderSmiley(NORMAL_SMILEY);
    // console.log(gBoard);
}

function initilizeGameObject() {
    gGame = {
        isOn: true,
        isFirstClick: true,
        lives: 3,
        hints: 3,
        isHintUsed: false,
        shownCount: 0,
        markedCount: 0,
        secsPasssed: 0,
        hintLocations: []
    }
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
            gLevel.title = 'Beginner';
            gLevel.mines = 2;
            break;
        case 8:
            gLevel.title = 'Medium';
            gLevel.mines = 12;
            break;
        case 12:
            gLevel.title = 'Expert';
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
        renderTime();
        gTimeInterval = setInterval(renderTime, 1000)
    } else return;
}

function renderTime() {
    document.querySelector('.time span').innerText = gGame.secsPasssed;
    gGame.secsPasssed++;
}

function renderLives() {
    var elLives = document.querySelector('.lives');
    var elLiveStr = elLives.querySelector('.lives-string');
    if (gGame.lives === 1) {
        elLiveStr.innerText = 'LIVE';
    } else {
        elLiveStr.innerText = 'LIVES';
    }
    elLives.querySelector('span').innerText = gGame.lives;
}

//Getting the cell itself, the row index and the col index of the cell
function cellClicked(elCell, i, j) {
    //don't click if the game is over
    if (!gGame.isOn) return;
    var cell = gBoard[i][j];

    //Can't change a displayed/marked cell
    if (cell.isShown || cell.isMarked) return;
    var cellLocation = { i, j };

    //when user presses a mine
    //With hint mode he can see the mine
    if (cell.isMine && !gGame.isHintUsed) {
        renderSmiley(DEAD_SMILEY);
        var smileyChangeTimeOut;
        elCell.classList.add('explosion');
        removeLife();
        if (gGame.lives === 0) {
            if (smileyChangeTimeOut) {
                clearTimeout(smileyChangeTimeOut);
                smileyChangeTimeOut = null;
            }
            renderSmiley(DEAD_SMILEY);
            setGameOver();
            return;
        } else {
            //Loosing a leg or 2 but still alive
            smileyChangeTimeOut = setTimeout(function() {
                renderSmiley(NORMAL_SMILEY);
                clearTimeout(smileyChangeTimeOut);
                smileyChangeTimeOut = null;
            }, 1000)
            elCell.innerText = MINE;
            cell.isMarked = true;
            cell.isShown = true;
            gGame.markedCount++;
            checkGameOver(gBoard);
            return;
        }
    }
    gBoard[i][j].isShown = true;
    //After first click the mines will be planted.
    if (gGame.isFirstClick) {
        gGame.isFirstClick = false;
        startTime();
        plantMines(gBoard);
        setMinesNegsCount(gBoard);
    }
    //User wanted to use a hint
    if (gGame.isHintUsed) {
        showHints(gBoard, elCell, cellLocation);
        //Removing the hint
        removeHint();
        //Starting a time out of 1 second
        var hideCellsTimeOut = setTimeout(function() {

            cell.isShown = false;
            elCell.innerText = '';
            //Hiding the cells that were displayed via the hint
            hideExpend(gBoard, elCell);
            clearInterval(hideCellsTimeOut);
            hideCellsTimeOut = null;
        }, 1000);
    } else {
        //Won't be shown during hint mode
        var cellContent = (cell.isMine) ? MINE : cell.minesAroundCount;
        if (cell.minesAroundCount === 0) {
            cellContent = '';
            expandShown(gBoard, cellLocation);
        }
        elCell.innerText = cellContent
        elCell.classList.add('shown');
        gGame.shownCount++;
        checkGameOver(gBoard);
    }
}

function expandShown(board, location) {
    var locationsNegs = getNegs(board, location.i, location.j);
    for (var i = 0; i < locationsNegs.length; i++) {
        var currLocation = locationsNegs[i];
        var currCell = board[currLocation.i][currLocation.j];
        if (!currCell.isShown) {
            var currElCell = getElCell(currLocation);
            var cellContent = (currCell.minesAroundCount) > 0 ? currCell.minesAroundCount : '';
            if (currCell.isMine) cellContent = MINE;
            currElCell.innerText = cellContent;
            if (currCell.isMarked) {
                currCell.isMarked = false;
                gGame.markedCount--;
            }
            currElCell.classList.add('shown');
            currCell.isShown = true;
            gGame.shownCount++;
            if (currCell.minesAroundCount === 0) {
                expandShown(board, currLocation);
            }
        }
    }
}

function showHints(board, elCell, location) {
    var cell = board[location.i][location.j];
    elCell.classList.add('shown');
    var cellContent = cell.isMine ? MINE : cell.minesAroundCount;
    elCell.innerText = (cellContent) ? cellContent : '';
    var locationsNegs = getNegs(board, location.i, location.j);
    for (var i = 0; i < locationsNegs.length; i++) {
        var currLocation = locationsNegs[i];
        var currCell = board[currLocation.i][currLocation.j];
        if (!currCell.isShown) {
            if (gGame.isHintUsed) {
                gGame.hintLocations.push(currLocation);
            }
            var currElCell = getElCell(currLocation);
            var cellContent = (currCell.minesAroundCount) > 0 ? currCell.minesAroundCount : '';
            if (currCell.isMine) cellContent = MINE;
            currElCell.innerText = cellContent;
            if (currCell.isMarked) {
                currCell.isMarked = false;
                gGame.markedCount--;
            }
            currElCell.classList.add('shown');
            currCell.isShown = true;
            if (!gGame.isHintUsed) gGame.shownCount++;
        }
    }
}

function hideExpend(board, elCell) {
    elCell.classList.remove('shown');
    while (gGame.hintLocations.length > 0) {
        var currLocation = gGame.hintLocations.shift();
        var currCell = board[currLocation.i][currLocation.j];
        var currElCell = getElCell(currLocation);
        currElCell.innerText = '';
        currElCell.classList.remove('shown');
        currCell.isShown = false;
    }
}

function cellMarked(ev, elCell) {
    ev.preventDefault();
    console.log(elCell.classList[0]);
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
    saveLocalStorage(gLevel.title, gGame.secsPasssed);
    setGameOver();
    renderSmiley(VICTORY_SMILEY);
}

function setGameOver() {
    gGame.isOn = false;
    renderBestScore();
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

function removeLife() {
    gGame.lives--;
    renderLives();
}

function renderSmiley(smiley) {
    document.querySelector('.smiley').innerText = smiley;
}

function restartGame() {
    setGameOver();
    initGame();
}

function useHint(elHint) {
    if (!gGame.isHintUsed) {
        elHint.src = HINT_USED;
        gGame.isHintUsed = true;
        elHint.classList.add('hint-active');
    }
}

function removeHint() {
    var elHint = document.querySelector('.hints .hint-active');
    if (!elHint) return;
    elHint.classList.remove('hint-active');
    elHint.src = HINT_UNUSED;
    elHint.style.display = 'none';
    gGame.isHintUsed = false;
    gGame.hints--;
}

function renderHints() {
    var elHints = document.querySelectorAll('.hint');
    for (var i = 0; i < elHints.length; i++) {
        elHints[i].style.display = 'initial';
        elHints[i].classList.remove('hint-active');
        elHints[i].src = HINT_UNUSED;
    }
}

function saveLocalStorage(gameLevel, gameTime) {
    //Time is always higher by 1 than the real time
    gameTime--;
    var storageStr = gameLevel + ';' + gameTime;
    var prevGameScore = getStorageBestScore(gameLevel);
    if (!prevGameScore) {
        localStorage.setItem('gameScore' + gameLevel, storageStr);
    } else {
        var timeValue = convertStrToBestTime(prevGameScore);
        if (isNaN(timeValue)) return;
        var bestTime = timeValue;
        if (gameTime < timeValue) bestTime = gameTime;
        storageStr = gameLevel + ';' + bestTime;
        localStorage.setItem('gameScore' + gameLevel, storageStr);
    }
}

function getStorageBestScore(gameLevel) {
    return localStorage.getItem('gameScore' + gameLevel);
}

function convertStrToBestTime(str) {
    if (!str) return;
    var values = str.split(';');
    return +values[1];
}

function renderBestScore() {
    var elBestScore = document.querySelector('.best-score-window');
    var bestScore = getStorageBestScore(gLevel.title);
    var timeValue = convertStrToBestTime(bestScore);
    if (isNaN(timeValue)) {
        elBestScore.style.visibility = 'hidden';
        return;
    }
    elBestScore.style.visibility = 'visible';
    elBestScore.querySelector('.game-level').innerText = gLevel.title;
    elBestScore.querySelector('.best-time').innerText = timeValue;
}

function getElCell(location) {
    var selector = getSelector(location);
    var elCell = document.querySelector(selector);
    return elCell;
}