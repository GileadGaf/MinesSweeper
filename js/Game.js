'use strict'

const MINE = '💥';
const FLAG = '🚩';
const NORMAL_SMILEY = '😃';
const DEAD_SMILEY = '😵';
const VICTORY_SMILEY = '😎';
const HINT_UNUSED = 'img/pic_bulboff.gif';
const HINT_USED = 'img/pic_bulbon.gif';

var gBoard;
var gLevel;
var gGame;
var gTimeInterval;

function initGame() {
    initilizeGameObject();
    if (!gLevel || !gLevel.minesCount) {
        initializeGameLevel();
    }
    if (gGame.gamePlayMode === 'original') renderBestScore();
    renderTime();
    renderLives();
    renderHints();
    renderSafeClicks();
    gBoard = buildBoard();
    renderBoard(gBoard);
    renderSmiley(NORMAL_SMILEY);
    if (!gGame.gamePlayMode) gGame.gamePlayMode = 'original'
    if (gGame.gamePlayMode === 'sandbox-start') refreshMines(gBoard);
    switchOriginalSandBoxTitles(true);
    closeModal();
}

function initilizeGameObject() {
    var gameMode = 'original';
    var cellsLocations = [];
    if (gGame) {
        gameMode = gGame.gamePlayMode;
        cellsLocations = gGame.cellsLocations;
    }
    gGame = {
        isOn: false,
        gamePlayMode: gameMode,
        livesCount: 3,
        hintsCount: 3,
        safeClicksCount: 3,
        isHintUsed: false,
        isSafeClickUsed: false,
        shownCount: 0,
        markedCount: 0,
        secsPasssed: 0,
        cellsLocations: cellsLocations
    }
}

function initializeGameLevel(title) {
    if (!title) {
        if (!gLevel) {
            title = 'Beginner';
            gLevel = {};
        } else title = gLevel.title;
    }
    gLevel.title = title;

    switch (gLevel.title) {
        case 'Beginner':
            gLevel.size = 4;
            gLevel.minesCount = 2;
            break;
        case 'Medium':
            gLevel.size = 8;
            gLevel.minesCount = 12;
            break;
        case 'Expert':
            gLevel.size = 12;
            gLevel.minesCount = 30;
            break;
        default:
            return;
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
    var emptyCells = getEmptyCells(board, true);
    if (!emptyCells.length) return;
    for (var i = 0; i < gLevel.minesCount; i++) {
        var location = emptyCells.pop();
        board[location.i][location.j].isMine = true;
    }
}

function changeLevel(elBtn) {
    if (gGame.gamePlayMode === 'sandbox-start') return;
    var boardSize = +elBtn.getAttribute('data-size');
    if (isNaN(boardSize)) return;
    if (gGame.gamePlayMode === 'sandbox') gGame.cellsLocations = [];
    removeClass('.active', 'active');
    elBtn.classList.add('active');
    gLevel = {};
    switch (boardSize) {
        case 4:
            initializeGameLevel('Beginner');
            break;
        case 8:
            initializeGameLevel('Medium');
            break;
        case 12:
            initializeGameLevel('Expert');
            break;
        default:
            return;
    }
    setGameOver();
    initGame();
}

function playSandBoxMode() {
    if (gGame.isOn) return;
    if (gGame.gamePlayMode === 'original') {
        gGame.gamePlayMode = 'sandbox';
        switchOriginalSandBoxTitles(false);
        //Making sure the cells locations array is empty
        gGame.cellsLocations = [];
    } else if (gGame.gamePlayMode === 'sandbox') {
        if (!gGame.cellsLocations.length) return;
        gGame.gamePlayMode = 'sandbox-start';
        hideExpend(gBoard, gGame.cellsLocations, false)
        gLevel.minesCount = gGame.cellsLocations.length;
        renderBoard(gBoard);
    } else if (gGame.gamePlayMode === 'sandbox-start') {
        gGame.gamePlayMode = 'original';
        gLevel = { title: gLevel.title };
        restartGame();
    }
    renderSandboxModeBtn();

}

function renderSandboxModeBtn() {
    var elBtn = document.querySelector('.sandbox-btn');
    switch (gGame.gamePlayMode) {
        case 'sandbox':
            elBtn.innerText = 'Play';
            elBtn.title = 'Press to play, You ,must have at least 1 mine!';
            break;
        case 'sandbox-start':
            elBtn.innerText = 'Playing';
            elBtn.title = 'Press to go back random deploy';
            elBtn.classList.add('active');
            break;
        case 'original':
        default:
            elBtn.innerText = 'Manual Deploy';
            elBtn.title = 'Pick a level and  then press this button';
            elBtn.classList.remove('active');
    }
}

function switchOriginalSandBoxTitles(isOriginal) {
    var elLevelSelection = document.querySelector('.level-select');
    var elLevelSelectTitle = elLevelSelection.querySelector('.level-select-title');
    var elSandboxTitle = elLevelSelection.querySelector('.sandbox-title');
    if (isOriginal) {
        elLevelSelectTitle.classList.remove('hidden');
        elSandboxTitle.classList.add('hidden');
    } else {
        elLevelSelectTitle.classList.add('hidden');
        elSandboxTitle.classList.remove('hidden');
    }
}

function refreshMines(board) {
    var cellsLocations = gGame.cellsLocations;
    if (cellsLocations) {
        for (var i = 0; i < cellsLocations.length; i++) {
            var currlocation = cellsLocations[i];
            if (currlocation.i >= 0 && currlocation.i < board.length &&
                currlocation.j >= 0 && currlocation.j <= board[0].length) {
                board[currlocation.i][currlocation.j].isMine = true;
            }
        }
    }
}

function getEmptyCells(board, isShuffleMode = false) {
    var emptyCells = [];
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j];
            if (!currCell.isShown && !currCell.isMarked && !currCell.isMine) {
                emptyCells.push({ i, j });
            }
        }
    }
    if (isShuffleMode) emptyCells = shuffle(emptyCells);
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
    if (gGame.livesCount === 1) {
        elLiveStr.innerText = 'LIVE';
    } else {
        elLiveStr.innerText = 'LIVES';
    }
    elLives.querySelector('span').innerText = gGame.livesCount;
}

//Getting the cell itself, the row index and the col index of the cell
function cellClicked(elCell, i, j) {
    //don't click if the game is over
    if (!gGame.livesCount) return;
    var cell = gBoard[i][j];


    var cellLocation = { i, j };

    //Can't change a displayed/marked cell
    if (cell.isShown || cell.isMarked) return;

    switch (gGame.gamePlayMode) {
        case 'original':
        case 'sandbox-start':
            originalGamePlayMode(elCell, cell, cellLocation);
            break;

        case 'hints':
            hintsGamePlayMode(elCell, cell, cellLocation)
            break;

        case 'sandbox':
            sandboxGamePlayMode(cellLocation)
            break;

        default:
            return
    }
}

function originalGamePlayMode(elCell, cell, location) {

    //when user presses a mine
    if (cell.isMine) {
        renderSmiley(DEAD_SMILEY);
        var smileyChangeTimeOut;
        elCell.classList.add('explosion');
        removeLife();
        if (gGame.livesCount === 0) {
            openModal();
            setGameOver();
            return;
        } else {
            //Loosing a leg or 2 but still alive
            smileyChangeTimeOut = setTimeout(function() {
                clearTimeout(smileyChangeTimeOut);
                smileyChangeTimeOut = null;
                if (gGame.isOn) {
                    renderSmiley(NORMAL_SMILEY);
                }
            }, 1000)
            elCell.innerText = MINE;
            cell.isMarked = true;
            cell.isShown = true;
            gGame.markedCount++;
            checkGameOver(gBoard);
            return;
        }
    }
    cell.isShown = true;
    //After first click the mines will be planted.
    if (!gGame.isOn) {
        gGame.isOn = true;
        startTime();
        if (gGame.gamePlayMode === 'original') {
            plantMines(gBoard);
        }
        setMinesNegsCount(gBoard);
    }
    //User wanted to use a hint
    //Won't be shown during hint mode
    var cellContent = (cell.isMine) ? MINE : cell.minesAroundCount;
    if (cell.minesAroundCount === 0) {
        cellContent = '';
        expandShown(gBoard, location);
    }
    elCell.innerText = cellContent
    elCell.classList.add('shown');
    gGame.shownCount++;
    checkGameOver(gBoard);

}

function hintsGamePlayMode(elCell, cell, location) {
    //User wanted to use a hint
    if (gGame.isHintUsed) {
        showHints(gBoard, elCell, location);
        //Removing the hint
        removeHint();
        //Starting a timeout of 1 second
        var hideCellsTimeOut = setTimeout(function() {

            cell.isShown = false;
            elCell.innerText = '';
            //Hiding the cells that were displayed via the hint
            elCell.classList.remove('shown');
            hideExpend(gBoard, gGame.cellsLocations);
            clearTimeout(hideCellsTimeOut);
            hideCellsTimeOut = null;
        }, 1000);
    }
}

function sandboxGamePlayMode(location) {
    gBoard[location.i][location.j].isMine = true;
    showCell(gBoard, location);
    gLevel.minesCount++;
    gGame.cellsLocations.push(location);

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
    //Making sure the cells locations array is empty
    gGame.cellsLocations = [];
    var cell = board[location.i][location.j];
    elCell.classList.add('shown');
    var cellContent = cell.isMine ? MINE : cell.minesAroundCount;
    elCell.innerText = (cellContent) ? cellContent : '';
    var locationsNegs = getNegs(board, location.i, location.j);
    for (var i = 0; i < locationsNegs.length; i++) {
        var currLocation = locationsNegs[i];
        var currCell = board[currLocation.i][currLocation.j];
        if (!currCell.isShown && !currCell.isMarked) {
            if (gGame.isHintUsed) {
                gGame.cellsLocations.push(currLocation);
            }
            var currElCell = getElCell(currLocation);
            var cellContent = (currCell.minesAroundCount) > 0 ? currCell.minesAroundCount : '';
            if (currCell.isMine) cellContent = MINE;
            currElCell.innerText = cellContent;
            currElCell.classList.add('shown');
            currCell.isShown = true;

        }
    }
}

function showCell(board, location) {
    var cell = board[location.i][location.j];
    var elCell = getElCell(location);
    if (!cell || !elCell) return;
    cell.isShown = true;
    var cellContent = cell.isMine ? MINE : cell.minesAroundCount;
    if (!cell.isMine && cell.minesAroundCount === 0) cellContent = '';
    elCell.innerText = cellContent;
    elCell.classList.add('shown');
}

function hideCell(board, location) {
    var cell = board[location.i][location.j];
    var elCell = getElCell(location);
    if (!cell || !elCell) return;
    cell.isShown = false;
    elCell.innerText = '';
    elCell.classList.remove('shown');
}
//Getting the board,locations array and a boolean option wheter to empty the array
// Default value is yes/true
function hideExpend(board, locations, isCellsDisposable = true) {
    for (var i = 0; i < locations.length; i++) {
        var currLocation = locations[i];
        var currCell = board[currLocation.i][currLocation.j];
        var currElCell = getElCell(currLocation);
        currElCell.innerText = '';
        currElCell.classList.remove('shown');
        currCell.isShown = false;
    }
    if (isCellsDisposable) locations = [];
}

function cellMarked(ev, elCell) {
    ev.preventDefault();
    var location = getCellLocation(elCell.id);
    switch (gGame.gamePlayMode) {
        case 'original':
        case 'sandbox-start':
            toggleFlags(elCell);
            break;
        case 'sandbox':
            removeMines(location);
            break;

        default:
            return;
    }


}

function toggleFlags(elCell) {
    if (!gGame.isOn) {
        gGame.isOn = true;
        startTime();
        plantMines(gBoard);
        setMinesNegsCount(gBoard);
    }
    var location = getCellLocation(elCell.id);
    if (!location) return;
    var cell = gBoard[location.i][location.j];
    if (cell.isShown) return;
    var cellContent = cell.isMarked ? '' : FLAG;
    elCell.innerText = cellContent;
    cell.isMarked = !cell.isMarked;
    if (cell.isMarked) gGame.markedCount++;
    else gGame.markedCount--;
    checkGameOver(gBoard);
}

function removeMines(location) {
    gBoard[location.i][location.j].isMine = false;
    hideCell(gBoard, location);
    gLevel.minesCount--;
    var x = findAndRemoveLocation(gGame.cellsLocations, location);
    console.log(x);
    // gGame.cellsLocations.push(location);
}

function findAndRemoveLocation(locations, location) {
    for (var i = 0; i < locations.length; i++) {
        var currLocation = locations[i];
        if (currLocation.i === location.i && currLocation.j === location.j) {
            locations.splice(i, 1);
            return i;
        }
    }
    return -1;
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

function checkGameOver(board) {
    //Number of flagged cells needs to be equal to number of mines
    if (gGame.markedCount !== gLevel.minesCount) return;
    //Number of shown cells needs to be equal to number of all cells minos mines
    if (gGame.shownCount !== ((gLevel.size ** 2) - gLevel.minesCount)) return;
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j];
            if (currCell.isMine && !currCell.isMarked) return;
        }
    }
    if (gGame.gamePlayMode === 'original') {
        saveLocalStorage(gLevel.title, gGame.secsPasssed);
    }
    openModal();
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

function openModal() {
    var elModal = document.querySelector('.modal');
    renderModalMsg(elModal);
    elModal.style.display = 'block';
}

function closeModal() {
    var elModal = document.querySelector('.modal');
    elModal.style.display = 'none';
}

function renderModalMsg(elModal) {
    var elMsg = elModal.querySelector('span');
    if (gGame.livesCount === 0) elMsg.innerText = 'Lost';
    else elMsg.innerText = 'Win';
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
    gGame.livesCount--;
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
    if (!gGame.isHintUsed && gGame.isOn) {
        elHint.src = HINT_USED;
        gGame.isHintUsed = true;
        gGame.gamePlayMode = 'hints';
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
    gGame.hintsCount--;
    gGame.gamePlayMode = 'original';
}

function renderHints() {
    var elHints = document.querySelectorAll('.hint');
    for (var i = 0; i < elHints.length; i++) {
        elHints[i].style.display = 'initial';
        elHints[i].classList.remove('hint-active');
        elHints[i].src = HINT_UNUSED;
    }
}

function displaySafeClick() {
    if (gGame.isSafeClickUsed) return;
    if (!gGame.safeClicksCount) return;
    if (gGame.isOn) {
        var emptyCells = getEmptyCells(gBoard, true);
        if (!emptyCells.length) return;
        gGame.isSafeClickUsed = true;
        showCell(gBoard, emptyCells[0]);
        gGame.safeClicksCount--;
        renderSafeClicks();
        setTimeout(function() {
            hideCell(gBoard, emptyCells[0]);
            gGame.isSafeClickUsed = false;
        }, 1000);
    }
}

function renderSafeClicks() {
    var elSafeClickContainer = document.querySelector('.safe-click-container');
    elSafeClickContainer.querySelector('.clicks-num').innerText = gGame.safeClicksCount;
    var singlePluMsg = gGame.safeClicksCount === 1 ? 'click' : 'clicks';
    elSafeClickContainer.querySelector('.single-plu-msg').innerText = singlePluMsg;
}

function saveLocalStorage(gameLevel, gameTime) {
    //gameTime is always higher by 1 than the real time
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
    if (values < 2) return;
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