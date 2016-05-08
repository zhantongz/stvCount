'use strict';

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function populate(votes) {
  var populated = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = votes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var vote = _step.value;

      Array(vote[0]).fill(vote[1]).forEach(function (v) {
        return populated.push(v);
      });
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return populated;
}

/**
 * Counts a candidate's votes at a position in the order of preference
 * @param {Number} pref The position of preference at which the votes for the
 * candidate is counted, e.g. `1` to count first-preference votes
 * @param {string} cand Name of the candidate
 * @param {string[][]} votes Votes to be counted
 * @returns {Number}
 */
function countPref(pref, cand, votes) {
  var count = 0;
  votes.forEach(function (v, i, arr) {
    if (v[pref - 1] === cand) count++;
  });
  return count;
}

var votes = [];
var candidates = ['a', 'b', 'c', 'd'];
var seats = 3;
var a = candidates[0];
var b = candidates[1];
var c = candidates[2];
var d = candidates[3];


votes = populate([[4, [a, b, c, d]], [1, [a, c, d, b]], [2, [b, a, d, c]], [3, [b, a, c, d]], [5, [a, d, b, c]], [4, [c, b, d, a]], [5, [d, c, b, a]]]);

var quota = Math.floor(votes.length / (seats + 1) + 1);
var hopefuls = candidates;
var excluded = [];
var elected = [];
var counts = [];

var roundCounts = {};

var _iteratorNormalCompletion2 = true;
var _didIteratorError2 = false;
var _iteratorError2 = undefined;

try {
  for (var _iterator2 = candidates[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
    var v = _step2.value;

    if (elected.length === seats) {
      break;
    }
    var count = countPref(1, v, votes);
    roundCounts[v] = count;
    if (count >= quota) {
      elected.push(v);
    }
  }
} catch (err) {
  _didIteratorError2 = true;
  _iteratorError2 = err;
} finally {
  try {
    if (!_iteratorNormalCompletion2 && _iterator2.return) {
      _iterator2.return();
    }
  } finally {
    if (_didIteratorError2) {
      throw _iteratorError2;
    }
  }
}

counts.push(roundCounts);

console.log('votes', votes);
console.log('votes #', votes.length);
console.log('quota', quota);
console.log('counts', counts);
console.log('elected', elected);
//# sourceMappingURL=all.js.map
