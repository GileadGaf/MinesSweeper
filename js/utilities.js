function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

//Gets an array and swaps it's indexes
function shuffle(items) {
    var randIdx, keep, i;
    for (i = items.length - 1; i > 0; i--) {
        randIdx = getRandomInt(0, items.length - 1);

        keep = items[i];
        items[i] = items[randIdx];
        items[randIdx] = keep;
    }
    return items;
}

// function getRandLocation(board) {
//     if (!board) return null;
//     var randRowIdx = getRandomInt(0, board.length);
//     var randColIdx = getRandomInt(0, board[0].length);
//     return { i: randRowIdx, j: randColIdx };

// }

function getSelector(location) {
    return '#cell-' + location.i + '-' + location.j
}