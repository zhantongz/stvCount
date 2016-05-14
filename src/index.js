const VERSION = 'v16.05.1'

import 'babel-polyfill';
import chalk from 'chalk';
import Table from 'cli-table';
const Converter = require('csvtojson').Converter;

let logging = true;
const log_ = (...args) => logging ? console.log(...args) : {};
const logTrue = (...args) => console.log(...args);

let precision = 6;

function populate(votes) {
  let populated = [];
  for (let vote of votes) {
    Array(vote[0]).fill(vote[1]).forEach(v => populated.push(v));
  }
  return populated;
}

Number.prototype.round = function(places) {
  return +(Math.round(this + 'e+' + places)  + 'e-' + places);
}

function getValues(object) {
  let values = new Array;
  for (let prop in object) {
    values.push(object[prop]);
  }
  return values;
}

function getMin(array) {
  return array.reduce((a, b) => Math.min(a, b));
}

function pick(object, ...fields) {
  let o = {};
  for (let field of fields) {
    Object.assign(o, {[field]: object[field]});
  }

  return o;
}

function removeBlanks(object) {
  return pick(object,
    ...Object.keys(object).filter(key => object[key] || object[key] === 0));
}

function countPref(pref, cand, votes) {
  let count = 0;
  votes.forEach((v, i, arr) => {
    if (v[pref - 1] === cand) count++;
  });
  return count;
}

function getPref(pref, cand, votes) {
  let count = [];
  votes.forEach((v, i, arr) => {
    if (v[pref - 1] === cand) count.push(i);
  });
  return count;
}

function round(votes, values, seats, quota, hopefuls, eliminated, elected,
  counts, surplus = {}, ron = '') {
  if (elected.length === seats) {
    log_('<all vacancies filled>')
    logTrue('********** COUNTING ENDS **********');
    return {
      elected,
      counts,
    }
  }

  if (hopefuls.length <= seats - elected.length) {
    log_('<remaining candidates can fill all vacancies>')
    hopefuls.forEach(v => {
      elected.push(v);
      log_(chalk.white.bgGreen('----- elected', v, '-----'));
    });
    logTrue('********** COUNTING ENDS **********');
    return {
      elected,
      counts,
    };
  }

  log_('########## ROUND', counts.length + 1, '##########');

  let distributed = {};
  if (Object.keys(surplus).length > 0) {
    distributed = distributeSurplus(votes, values, counts[counts.length - 1],
      surplus);
    surplus = {};
  }

  let roundCount = {};
  let roundElected = [];
  let hasElected = false;

  for (let v of hopefuls) {
    let count = 0;
    if (counts.length === 0) {
      count = countPref(1, v, votes);
    } else {
      count = distributed[v];
    }
    roundCount[v] = count;
    if (count >= quota) {
      roundElected.push(v);
      elected.push(v);
      hopefuls = hopefuls.filter(h => h !== v);
    }
  }

  counts.push(roundCount);
  log_('+++++ round count +++++');
  roundCountTable(roundCount);

  let excluded = [...elected, ...eliminated];
  if (roundElected.length === 0) {
    let elimCand = eliminate(votes, values, '', roundCount, hopefuls, excluded,
    surplus, counts, ron);
    eliminated.push(elimCand);
    hopefuls = hopefuls.filter(v => v !== elimCand);
    log_(chalk.gray.bgYellow('----- eliminated', elimCand, '-----'));
  } else {
    roundElected.forEach(v => {
      log_(chalk.white.bgGreen('----- elected', v, '-----'));
      eliminate(votes, values, v, roundCount, hopefuls, excluded, surplus,
        counts, ron, roundCount[v] - quota);
    });
  }

  if (counts.length < 20) {} else {return;}
  return round(votes, values, seats, quota, hopefuls, eliminated, elected,
    counts, surplus, ron);
}

function countSurplus(votes, values, candidate, hopefuls, excluded) {
  let surplus = {};
  let transferred = votes.map((val, ind, arr) => {
    if (val[0] === candidate) return val.slice();
    return [];
  });
  let total = transferred.length;

  for (let exclude of excluded) {
    transferred.forEach((val, ind, arr) => {
      transferred[ind] = val.filter(v => v !== exclude);
    });
  }

  for (let hopeful of hopefuls) {
    surplus[hopeful] = getPref(1, hopeful, transferred);
  }

  return {
    dist: surplus,
  };
}

function distributeSurplus(votes, values, lastCounts, surplus) {
  let count = Object.assign({}, lastCounts);
  let totalTransferred = {};
  for (let candidate in surplus) {
    if (surplus.hasOwnProperty(candidate)) {
      totalTransferred = 0;
      let tableCount = {};
      let dist = surplus[candidate].dist;
      if (surplus[candidate].surplus < count[candidate]) {
        if (count[candidate] > 0) {
          let value = surplus[candidate].surplus / count[candidate];
          for (let transfer in dist) {
            if (dist.hasOwnProperty(transfer)) {
              for (let nextPref of dist[transfer]) {
                values[nextPref] *= value;
              }
            }
          }
        }
      }

      log_(chalk.magenta('----- distributing surplus -----'));
      for (let transfer in dist) {
        if (dist.hasOwnProperty(transfer)) {
          tableCount[transfer] = 0;
          for (let nextPref of dist[transfer]) {
            count[transfer] += values[nextPref];

            tableCount[transfer] += values[nextPref];
            totalTransferred += values[nextPref];
          }
          count[transfer] = count[transfer].round(precision);
        }
      }

      log_(chalk.bold(candidate));
      for (let transfer in tableCount) {
        if (tableCount[transfer])
          log_('- transfers', chalk.underline(tableCount[transfer]),
            'vote(s) to', chalk.underline(transfer));
      }

      log_('-', chalk.bold('Transfer in total:'),
        chalk.underline(totalTransferred), chalk.bold('Exhausted:'),
        chalk.underline(surplus[candidate].surplus - totalTransferred));

    }
  }
  return count;
}

function eliminate(votes, values, candidate, roundCount, hopefuls, excluded,
surplus, counts, ron, surplusVotes = null) {
  if (candidate === '') {
    candidate = Object.keys(roundCount).filter(v => v !== ron);
    let minVotes = 0;
    if (!ron) {
      minVotes = getMin(getValues(roundCount));
    } else {
      let roundCount_ = Object.assign({}, roundCount);
      if (roundCount_.hasOwnProperty(ron)) {
        delete roundCount_[ron];
      } else {
        console.error(chalk.bold.red('***** RON candidate not found *****'));
      }
      minVotes = getMin(getValues(roundCount_));
    }
    let potentials = [];
    candidate.forEach(function(val, ind) {
      if (roundCount[val] === minVotes) {
        potentials.push(ind);
      }
    });
    if (potentials.length <= 0)
      console.error(chalk.bold.red(
        '********** unable to continue elimination **********'));
    if (potentials.length === 1) {
      candidate = candidate[potentials[0]];
    } else {
      let potentialCands = [];
      for (let ind of potentials) {
        potentialCands.push(candidate[ind])
      }
      candidate = breakTie(potentialCands, counts);
    }
    excluded.push(candidate);
    hopefuls = hopefuls.filter(v => v !== candidate);
  }

  surplus[candidate] = countSurplus(votes, values, candidate, hopefuls,
    excluded);
  surplus[candidate].surplus = surplusVotes !== null ?
    surplusVotes : roundCount[candidate];

  votes.forEach((val, ind, arr) => {
    votes[ind] = val.filter(v => v !== candidate);
  });

  return candidate;
}

function breakTie(potentials, counts) {
  log_('*a tie!*');
  if (counts.length > 0) {
    let lastCount = counts[counts.length - 1];
    let lastCounts = pick(lastCount, ...potentials);
    let minVotes = getMin(getValues(lastCounts));
    let potentialsTie = [];
    potentials.forEach(function(val, ind) {
      if (lastCounts[val] === minVotes) {
        potentialsTie.push(ind);
      }
    });
    if (potentialsTie.length <= 0)
      console.error('********** unable to continue elimination **********');
    if (potentialsTie.length === potentials.length) {
      let against = potentials[Math.floor(Math.random() * potentials.length)];
      log_('----- tie randomly broken against', against, '-----');
      return against;
    }
    if (potentialsTie.length === 1) {
      let against = potentials[potentialsTie[0]];
      log_('----- tie broken against', against, '-----');
      return against;
    }
    let potentialCands = [];
    for (let ind in potentialsTie) {
      potentialCands.push(potentials[ind])
    }
    return breakTie(potentialCands, counts.slice(0, -1));
  }
}

function roundCountTable(roundCount) {
  let table = new Table();
  for (let candidate in roundCount) {
    table.push({
      [chalk.cyan.bold(candidate)]: roundCount[candidate],
    });
  }
  return log_(table.toString());
}

function countsTable(counts, elected) {
  const isElected = candidate => elected.includes(candidate) ?
    chalk.bold.green('✓') : chalk.bold.red('✗');
  let table = new Table({
    head: [chalk.blue.bold('Round'), ...Array.from(new Array(counts.length),
      (x, i) => chalk.blue.bold(i + 1)), chalk.bold.green('Elected'),],
  });

  for (let candidate in counts[0]) {
    table.push({
      [chalk.cyan.bold(candidate)]: [...Array.from(new Array(counts.length),
        (x, i) => candidate in counts[i] ?
          counts[i][candidate] : isElected(candidate)),
        isElected(candidate),],
    })
  }

  return log_(table.toString());
}

function getCandidates(votes) {
  return [...new Set([].concat(...votes))];
}

export function count({votes, candidates, seats, quota, log, ron}) {
  if (log === false) {
    logging = false;
  }

  ron = ron || '';
  logTrue(chalk.underline('stvCount', VERSION, '(c) Z. Tong Zhang'));
  logTrue('********** COUNTING STARTS **********')

  if (quota < 0) quota = Math.floor(votes.length / (seats + 1) + 1);
  let values = new Array(votes.length).fill(1);
  let result = round(votes, values, seats, quota, candidates, [], [], [], {},
    ron);
  log_('votes #:', votes.length);
  log_('quota:', quota);
  countsTable(result.counts, result.elected);

  let elected = new Table({head: [chalk.bold.green('ELECTED')]});
  result.elected.forEach(v => elected.push([v]));
  log_(elected.toString());

  return result;
}

export function csvCount(csv, options) {
  precision = options.precision || 6;
  let converter = new Converter({});
  converter.on('end_parsed', jsonArray => {
    let votes = [];
    let ind = 0;
    for (let vote of jsonArray) {
      vote = removeBlanks(vote);
      let voteArray = Object.keys(vote).sort((a, b) => vote[a] - vote[b]);
      let temp = [];
      for (let i of voteArray)
        i && temp.push(i);

      voteArray = temp;
      votes[ind++] = voteArray;
    }
    options.votes = votes;
    options.candidates = options.candidates || getCandidates(json);
    return count(options);
  });

  if (typeof csv.pipe === 'function') {
    csv.resume().pipe(converter);
  } else if (typeof csv === 'string') {
    converter.fromString(csv);
  } else {
    console.error('Error: CSV stream or string needed');
  }
}

export function jsonCount(json, options) {
  precision = options.precision || 6;
  options.votes = json;
  options.candidates = options.candidates || getCandidates(json);

  return count(options);
}

export function bltCount(blt, options) {

}
