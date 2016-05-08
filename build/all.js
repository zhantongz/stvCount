'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

require('babel-polyfill');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var num = 0;

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

Number.prototype.round = function (places) {
  return +(Math.round(this + 'e+' + places) + 'e-' + places);
};

/**
 * A single transferrable vote, containing an array of names of candidates
 * (`string`s) in order of preference indicated, i.e. first-preference vote is
 * at index `0`.
 * @typedef {string[][]} vote
 */

/**
 * Counts a candidate's votes in a position on ranked ballot
 * @param {number} pref The position of preference at which the votes for the
 * candidate is counted, e.g. `pref = 1` to count first-preference votes
 * @param {string} cand Name of the candidate
 * @param {vote[]} votes Votes to be counted
 * @returns {number} Number of votes the candidate receives at the specified
 * position on the ballot
 */
function countPref(pref, cand, votes) {
  var count = 0;
  votes.forEach(function (v, i, arr) {
    if (v[pref - 1] === cand) count++;
  });
  return count;
}

/**
 * Does a round of counting for STV
 * @param  {vote[]} votes    Votes to be counted
 * @param  {number} seats    Number of seats available
 * @param  {number} [quota] Quota needed to declared a candidate elected;
 * defaults to Droop quota calculated from `votes.length` and `seats`
 * @param  {string[]} hopefuls List of candidates to be counted, i.e. neither
 * elected nor eliminated
 * @param  {string[]} eliminated List of candidates eliminated from counting
 * @param  {string[]} elected  List of already elected candidates
 * @param  {Object[]} counts   History of votes received by the candidates in
 * previous rounds
 * @param  {Object} [surplus = {}] Surplus votes to be redistributed from last
 * round; defaults to `{}`
 * @return {string[]}          List of all elected candidates after this round
 */
function round(votes, seats) {
  var quota = arguments.length <= 2 || arguments[2] === undefined ? -1 : arguments[2];
  var hopefuls = arguments[3];
  var eliminated = arguments[4];
  var elected = arguments[5];
  var counts = arguments[6];
  var surplus = arguments.length <= 7 || arguments[7] === undefined ? {} : arguments[7];

  if (elected.length === seats) {
    return {
      elected: elected,
      counts: counts
    };
  }

  if (quota === -1) {
    quota = Math.floor(votes.length / (seats + 1) + 1);
  }
  var distributed = {};
  if (Object.keys(surplus).length > 0) {
    console.log('surplus', surplus);
    distributed = distributeSurplus(votes, counts[counts.length - 1], surplus);
    surplus = {};
  }

  var roundCounts = {};
  var roundElected = [];
  var hasElected = false;

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    var _loop = function _loop() {
      var v = _step2.value;

      var count = 0;
      if (counts.length === 0) {
        count = countPref(1, v, votes);
      } else {
        count = distributed[v];
      }
      roundCounts[v] = count;
      if (count >= quota) {
        roundElected.push(v);
        elected.push(v);
        hopefuls = hopefuls.filter(function (e) {
          return e !== v;
        });
      }
    };

    for (var _iterator2 = hopefuls[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      _loop();
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

  var excluded = [].concat(_toConsumableArray(elected), _toConsumableArray(eliminated));
  if (roundElected.length === 0) {
    var elimCand = eliminate(votes, '', roundCounts, hopefuls, excluded, surplus, counts);
    eliminated.push(elimCand);
  } else {
    roundElected.forEach(function (v) {
      console.log('elected', v);
      eliminate(votes, v, roundCounts, hopefuls, excluded, surplus, counts, roundCounts[v] - quota);
    });
  }

  counts.push(roundCounts);
  console.log('round count', roundCounts);
  console.log('round', ++num);
  return round(votes, seats, quota, hopefuls, eliminated, elected, counts, surplus);
}

function countSurplus(votes, candidate, hopefuls, excluded) {
  var surplus = {};
  var transferred = _lodash2.default.cloneDeep(votes).filter(function (val, ind, arr) {
    if (val[0] === candidate) return true;
    return false;
  });
  var total = transferred.length;

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    var _loop2 = function _loop2() {
      var exclude = _step3.value;

      transferred.forEach(function (val, ind, arr) {
        transferred[ind] = val.filter(function (e) {
          return e !== exclude;
        });
      });
    };

    for (var _iterator3 = excluded[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      _loop2();
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = hopefuls[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var hopeful = _step4.value;

      surplus[hopeful] = countPref(1, hopeful, transferred);
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  return {
    dist: surplus,
    total: total
  };
}
function distributeSurplus(votes, lastCounts, surplus) {
  var count = Object.assign({}, lastCounts);
  for (var candidate in surplus) {
    if (surplus.hasOwnProperty(candidate)) {
      var dist = surplus[candidate].dist;
      var value = surplus[candidate].surplus / surplus[candidate].total;

      for (var transfer in dist) {
        if (dist.hasOwnProperty(transfer)) {
          count[transfer] += (dist[transfer] * value).round(PRECISION);
        }
      }
    }
  }
  return count;
}

function eliminate(votes, candidate, roundCounts, hopefuls, excluded, surplus, counts) {
  var surplusVotes = arguments.length <= 7 || arguments[7] === undefined ? 0 : arguments[7];

  if (candidate === '') {
    (function () {
      candidate = Object.keys(roundCounts);
      var minVotes = _lodash2.default.min(_lodash2.default.values(roundCounts));
      var potentials = [];
      candidate.forEach(function (val, ind) {
        if (roundCounts[val] === minVotes) {
          potentials.push(ind);
        }
      });
      if (potentials.length <= 0) console.error('case 1. unable to continue elimination');
      if (potentials.length === 1) {
        candidate = candidate[potentials[0]];
      } else {
        candidate = breakTie(potentials, counts);
      }
      excluded.push(candidate);
      hopefuls = hopefuls.filter(function (e) {
        return e !== candidate;
      });
    })();
  }

  surplus[candidate] = countSurplus(votes, candidate, hopefuls, excluded);
  surplus[candidate].surplus = surplusVotes || roundCounts[candidate];

  votes.forEach(function (val, ind, arr) {
    votes[ind] = val.filter(function (e) {
      return e !== candidate;
    });
  });

  return candidate;
}

/**
 * Breaks a tie in elimination step by returning the candidate with lowest
 * number of votes in the last round; if fails to break after counting all
 * previous rounds, a random candidate is returned
 * @param  {string[]} potentials List of tied candidates
 * @param  {Object[]} counts     History of votes received by the candidates in
 * previous rounds
 * @return {string}            Candidate to be eliminated after breaking the tie
 */
function breakTie(potentials, counts) {
  console.error('a tie!');
  if (counts.length > 0) {
    var _ret4 = function () {
      var lastCount = counts[counts.length - 1];
      var lastCounts = _lodash2.default.pick(lastCount, potentials);
      var minVotes = _lodash2.default.min(_lodash2.default.values(lastCounts));
      var potentialsTie = potentials.reduce(function (prev, curr, ind, arr) {
        if (curr === minVotes) {
          prev.push(ind);
        }
        return prev;
      }, []);
      if (potentialsTie.length <= 0) console.error('unable to continue elimination');
      if (potentialsTie.length === potentials.length) {
        return {
          v: potentials[Math.floor(Math.random() * potentials.length)]
        };
      }
      if (potentialsTie.length === 1) {
        return {
          v: potentials[potentialsTie[0]]
        };
      }
      return {
        v: breakTie(potentialsTie, counts.slice(0, -1))
      };
    }();

    if ((typeof _ret4 === 'undefined' ? 'undefined' : _typeof(_ret4)) === "object") return _ret4.v;
  }
}

function test() {
  var votes_ = [];
  var candidates_ = ['a', 'b', 'c', 'd'];
  var seats_ = 3;
  var a = candidates_[0];
  var b = candidates_[1];
  var c = candidates_[2];
  var d = candidates_[3];


  votes_ = populate([[4, [a, b, c, d]], [1, [a, c, d, b]], [2, [b, a, d, c]], [3, [b, a, c, d]], [5, [a, d, b, c]], [4, [c, b, d, a]], [5, [d, c, b, a]]]);

  var quota_ = Math.floor(votes_.length / (seats_ + 1) + 1); // Droop
  var PRECISION = 6;
  var result = round(votes_, seats_, quota_, candidates_, [], [], []);

  console.log('votes #', votes_.length);
  console.log('quota', quota_);
  console.log('counts', result.counts);
  console.log('elected', result.elected);
}
//# sourceMappingURL=all.js.map
