'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

require('babel-polyfill');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var VERSION = 'v16.05.1';

var Table = require('cli-table');

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

function getPref(pref, cand, votes) {
  var count = [];
  votes.forEach(function (v, i, arr) {
    if (v[pref - 1] === cand) count.push(i);
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
function round(votes, values, seats) {
  var quota = arguments.length <= 3 || arguments[3] === undefined ? -1 : arguments[3];
  var hopefuls = arguments[4];
  var eliminated = arguments[5];
  var elected = arguments[6];
  var counts = arguments[7];
  var surplus = arguments.length <= 8 || arguments[8] === undefined ? {} : arguments[8];

  if (elected.length === seats) {
    console.log('<all vacancies filled>');
    console.log('********** COUNTING ENDS **********');
    return {
      elected: elected,
      counts: counts
    };
  }

  if (hopefuls.length <= seats - elected.length) {
    console.log('<remaining candidates can fill all vacancies>');
    hopefuls.forEach(function (v) {
      elected.push(v);
      console.log(_chalk2.default.white.bgGreen('----- elected', v, '-----'));
    });
    console.log('********** COUNTING ENDS **********');
    return {
      elected: elected,
      counts: counts
    };
  }

  console.log('---------- ROUND', counts.length + 1, '----------');

  if (quota === -1) {
    quota = Math.floor(votes.length / (seats + 1) + 1);
  }
  var distributed = {};
  if (Object.keys(surplus).length > 0) {
    distributed = distributeSurplus(votes, values, counts[counts.length - 1], surplus);
    surplus = {};
  }

  var roundCount = {};
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
      roundCount[v] = count;
      if (count >= quota) {
        roundElected.push(v);
        elected.push(v);
        hopefuls = hopefuls.filter(function (h) {
          return h !== v;
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

  counts.push(roundCount);
  console.log('+++++ round count +++++');
  roundCountTable(roundCount);

  var excluded = [].concat(_toConsumableArray(elected), _toConsumableArray(eliminated));
  if (roundElected.length === 0) {
    (function () {
      var elimCand = eliminate(votes, values, '', roundCount, hopefuls, excluded, surplus, counts);
      eliminated.push(elimCand);
      hopefuls = hopefuls.filter(function (v) {
        return v !== elimCand;
      });
      console.log(_chalk2.default.gray.bgYellow('----- eliminated', elimCand, '-----'));
    })();
  } else {
    roundElected.forEach(function (v) {
      console.log(_chalk2.default.white.bgGreen('----- elected', v, '-----'));
      eliminate(votes, values, v, roundCount, hopefuls, excluded, surplus, counts, roundCount[v] - quota);
    });
  }

  if (counts.length < 20) {} else {
    return;
  }
  return round(votes, values, seats, quota, hopefuls, eliminated, elected, counts, surplus);
}

function countSurplus(votes, values, candidate, hopefuls, excluded) {
  var surplus = {};
  var transferred = _lodash2.default.cloneDeep(votes).map(function (val, ind, arr) {
    if (val[0] === candidate) return val;
    return [];
  });
  var total = transferred.length;

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    var _loop2 = function _loop2() {
      var exclude = _step3.value;

      transferred.forEach(function (val, ind, arr) {
        transferred[ind] = val.filter(function (v) {
          return v !== exclude;
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

      surplus[hopeful] = getPref(1, hopeful, transferred);
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
    dist: surplus
  };
}

function distributeSurplus(votes, values, lastCounts, surplus) {
  var count = Object.assign({}, lastCounts);
  var totalTransferred = {};
  for (var candidate in surplus) {
    if (surplus.hasOwnProperty(candidate)) {
      totalTransferred = 0;
      var tableCount = {};
      var dist = surplus[candidate].dist;
      if (surplus[candidate].surplus < count[candidate]) {
        if (count[candidate] > 0) {
          var value = surplus[candidate].surplus / count[candidate];
          for (var transfer in dist) {
            if (dist.hasOwnProperty(transfer)) {
              var _iteratorNormalCompletion5 = true;
              var _didIteratorError5 = false;
              var _iteratorError5 = undefined;

              try {
                for (var _iterator5 = dist[transfer][Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                  var nextPref = _step5.value;

                  values[nextPref] *= value;
                }
              } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion5 && _iterator5.return) {
                    _iterator5.return();
                  }
                } finally {
                  if (_didIteratorError5) {
                    throw _iteratorError5;
                  }
                }
              }
            }
          }
        }
      }

      console.log(_chalk2.default.magenta('----- distributing surplus -----'));
      for (var _transfer in dist) {
        if (dist.hasOwnProperty(_transfer)) {
          tableCount[_transfer] = 0;
          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = dist[_transfer][Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              var _nextPref = _step6.value;

              count[_transfer] += values[_nextPref];

              tableCount[_transfer] += values[_nextPref];
              totalTransferred += values[_nextPref];
            }
          } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
              }
            } finally {
              if (_didIteratorError6) {
                throw _iteratorError6;
              }
            }
          }

          count[_transfer] = count[_transfer].round(PRECISION);
        }
      }

      console.log(_chalk2.default.bold(candidate));
      for (var _transfer2 in tableCount) {
        if (tableCount[_transfer2]) console.log('- transfers', _chalk2.default.underline(tableCount[_transfer2]), 'votes to', _chalk2.default.underline(_transfer2));
      }

      console.log('-', _chalk2.default.bold('Transfer in total:'), _chalk2.default.underline(totalTransferred), _chalk2.default.bold('Exhausted:'), _chalk2.default.underline(surplus[candidate].surplus - totalTransferred));
    }
  }
  return count;
}

function eliminate(votes, values, candidate, roundCount, hopefuls, excluded, surplus, counts) {
  var surplusVotes = arguments.length <= 8 || arguments[8] === undefined ? null : arguments[8];


  if (candidate === '') {
    (function () {
      candidate = Object.keys(roundCount);
      var minVotes = _lodash2.default.min(_lodash2.default.values(roundCount));
      var potentials = [];
      candidate.forEach(function (val, ind) {
        if (roundCount[val] === minVotes) {
          potentials.push(ind);
        }
      });
      if (potentials.length <= 0) console.error('********** unable to continue elimination **********');
      if (potentials.length === 1) {
        candidate = candidate[potentials[0]];
      } else {
        var potentialCands = [];
        var _iteratorNormalCompletion7 = true;
        var _didIteratorError7 = false;
        var _iteratorError7 = undefined;

        try {
          for (var _iterator7 = potentials[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var ind = _step7.value;

            potentialCands.push(candidate[ind]);
          }
        } catch (err) {
          _didIteratorError7 = true;
          _iteratorError7 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion7 && _iterator7.return) {
              _iterator7.return();
            }
          } finally {
            if (_didIteratorError7) {
              throw _iteratorError7;
            }
          }
        }

        candidate = breakTie(potentialCands, counts);
      }
      excluded.push(candidate);
      hopefuls = hopefuls.filter(function (v) {
        return v !== candidate;
      });
    })();
  }

  surplus[candidate] = countSurplus(votes, values, candidate, hopefuls, excluded);
  surplus[candidate].surplus = surplusVotes !== null ? surplusVotes : roundCount[candidate];

  votes.forEach(function (val, ind, arr) {
    votes[ind] = val.filter(function (v) {
      return v !== candidate;
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
  console.log('*a tie!*');
  if (counts.length > 0) {
    var _ret5 = function () {
      var lastCount = counts[counts.length - 1];
      var lastCounts = _lodash2.default.pick(lastCount, potentials);
      var minVotes = _lodash2.default.min(_lodash2.default.values(lastCounts));
      var potentialsTie = [];
      potentials.forEach(function (val, ind) {
        if (lastCounts[val] === minVotes) {
          potentialsTie.push(ind);
        }
      });
      if (potentialsTie.length <= 0) console.error('********** unable to continue elimination **********');
      if (potentialsTie.length === potentials.length) {
        var against = potentials[Math.floor(Math.random() * potentials.length)];
        console.log('----- tie randomly broken against', against, '-----');
        return {
          v: against
        };
      }
      if (potentialsTie.length === 1) {
        var _against = potentials[potentialsTie[0]];
        console.log('----- tie broken against', _against, '-----');
        return {
          v: _against
        };
      }
      var potentialCands = [];
      for (var ind in potentialsTie) {
        potentialCands.push(potentials[ind]);
      }
      return {
        v: breakTie(potentialCands, counts.slice(0, -1))
      };
    }();

    if ((typeof _ret5 === 'undefined' ? 'undefined' : _typeof(_ret5)) === "object") return _ret5.v;
  }
}

function count(_ref) {
  var votes = _ref.votes;
  var candidates = _ref.candidates;
  var seats = _ref.seats;
  var quota = _ref.quota;

  console.log(_chalk2.default.underline('stvCount', VERSION, '(c) Z. Tong Zhang\n'));
  console.log('********** COUNTING STARTS **********');

  if (quota < 0) quota = Math.floor(votes.length / (seats + 1) + 1);
  var values = new Array(votes.length).fill(1);
  var result = round(votes, values, seats, quota, candidates, [], [], []);

  console.log('votes #:', votes.length);
  console.log('quota:', quota);
  countsTable(result.counts, result.elected);

  var elected = new Table({ head: [_chalk2.default.bold.green('ELECTED')] });
  result.elected.forEach(function (v) {
    return elected.push([v]);
  });
  console.log(elected.toString());

  return result;
}

function roundCountTable(roundCount) {
  var table = new Table();
  for (var candidate in roundCount) {
    table.push(_defineProperty({}, _chalk2.default.cyan.bold(candidate), roundCount[candidate]));
  }
  return console.log(table.toString());
}

function countsTable(counts, elected) {
  var isElected = function isElected(candidate) {
    return elected.includes(candidate) ? _chalk2.default.bold.green('✓') : _chalk2.default.bold.red('✗');
  };
  var table = new Table({
    head: [_chalk2.default.blue.bold('Round')].concat(_toConsumableArray(Array.from(new Array(counts.length), function (x, i) {
      return _chalk2.default.blue.bold(i + 1);
    })), [_chalk2.default.bold.green('Elected')])
  });

  var _loop3 = function _loop3(candidate) {
    table.push(_defineProperty({}, _chalk2.default.cyan.bold(candidate), [].concat(_toConsumableArray(Array.from(new Array(counts.length), function (x, i) {
      return candidate in counts[i] ? counts[i][candidate] : isElected(candidate);
    })), [isElected(candidate)])));
  };

  for (var candidate in counts[0]) {
    _loop3(candidate);
  }

  return console.log(table.toString());
}

var options = require('../options.json');
var PRECISION = options.precision || 6;
var Converter = require('csvtojson').Converter;
var converter = new Converter({});

converter.on('end_parsed', function (jsonArray) {
  var votes = [];
  var ind = 0;
  var _iteratorNormalCompletion8 = true;
  var _didIteratorError8 = false;
  var _iteratorError8 = undefined;

  try {
    var _loop4 = function _loop4() {
      var vote = _step8.value;

      vote = _lodash2.default.pickBy(vote, _lodash2.default.identity);
      var voteArray = Object.keys(vote).sort(function (a, b) {
        return vote[a] - vote[b];
      });
      var temp = [];
      var _iteratorNormalCompletion9 = true;
      var _didIteratorError9 = false;
      var _iteratorError9 = undefined;

      try {
        for (var _iterator9 = voteArray[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
          var i = _step9.value;

          i && temp.push(i);
        }
      } catch (err) {
        _didIteratorError9 = true;
        _iteratorError9 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion9 && _iterator9.return) {
            _iterator9.return();
          }
        } finally {
          if (_didIteratorError9) {
            throw _iteratorError9;
          }
        }
      }

      voteArray = temp;
      votes[ind++] = voteArray;
    };

    for (var _iterator8 = jsonArray[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
      _loop4();
    }
  } catch (err) {
    _didIteratorError8 = true;
    _iteratorError8 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion8 && _iterator8.return) {
        _iterator8.return();
      }
    } finally {
      if (_didIteratorError8) {
        throw _iteratorError8;
      }
    }
  }

  options.votes = votes;
  count(options);
});

require('fs').createReadStream('./votes.csv').pipe(converter);
//# sourceMappingURL=all.js.map
