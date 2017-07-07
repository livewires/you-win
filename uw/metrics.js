(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  } else {
    root.textMetrics = factory()
  }
}(this, function() {

  function metrics(arr) {
    const map = {}
    arr.forEach(([chr, width, dx], index) => {
      map[chr] = {index, width, dx}
    })
    return map
  }

  const Munro = metrics([
    ['A', 5],
    ['B', 5],
    ['C', 4],
    ['D', 5],
    ['E', 4],
    ['F', 4],
    ['G', 5],
    ['H', 5],
    ['I', 2],
    ['J', 3],
    ['K', 5],
    ['L', 4],
    ['M', 6],
    ['N', 5],
    ['O', 5],
    ['P', 5],
    ['Q', 5],
    ['R', 5],
    ['S', 4],
    ['T', 4],
    ['U', 5],
    ['V', 6],
    ['W', 6],
    ['X', 6],
    ['Y', 6],
    ['Z', 4],
    ['a', 5],
    ['b', 5],
    ['c', 4],
    ['d', 5],
    ['e', 5],
    ['f', 3],
    ['g', 5],
    ['h', 5],
    ['i', 2],
    ['j', 2, 1],
    ['k', 5],
    ['l', 2],
    ['m', 8],
    ['n', 5],
    ['o', 5],
    ['p', 5],
    ['q', 5],
    ['r', 4],
    ['s', 4],
    ['t', 4],
    ['u', 5],
    ['v', 6],
    ['w', 8],
    ['x', 6],
    ['y', 5],
    ['z', 4],
    ['0', 5],
    ['1', 3],
    ['2', 4],
    ['3', 4],
    ['4', 5],
    ['5', 4],
    ['6', 5],
    ['7', 4],
    ['8', 5],
    ['9', 5],
    [',', 2],
    ['.', 2],
    [':', 2],
    [';', 2],
    ['"', 4],
    ["'", 2],
    ['!', 2],
    ['?', 4],
    ['&', 7],
    ['@', 8],
    ['£', 5],
    ['$', 4],
    ['|', 4],
    ['/', 4],
    ['\\', 4],
    ['<', 5],
    ['>', 5],
    ['(', 3],
    [')', 3],
    ['{', 4],
    ['}', 4],
    ['+', 6],
    ['-', 4],
    ['=', 5],
    ['%', 8],
    ['*', 4],
    ['=', 5],
    ['[', 3],
    [']', 3],
    ['^', 4],
    ['_', 6],
    ['~', 6],
    [' ', 5],
  ])

  return {Munro}

}));
