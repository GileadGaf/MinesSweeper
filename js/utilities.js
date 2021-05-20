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

function getSelector(location) {
    return '#cell-' + location.i + '-' + location.j
}