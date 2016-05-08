import 'babel-polyfill';
import _ from 'lodash'

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
  let count = 0;
  votes.forEach((v, i, arr) => {
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
function round(votes, seats, quota = -1, hopefuls, eliminated, elected, counts,
surplus = {}) {
  if (elected.length === seats) {
    return {
      elected,
      counts,
    }
  }

  if (hopefuls.length <= seats - elected.length) {
    elected = [...elected, ...hopefuls];
    return {
      elected,
      counts,
    }
  }

  if (quota === -1) {
    quota = Math.floor(votes.length / (seats + 1) + 1);
  }
  let distributed = {};
  if (Object.keys(surplus).length > 0) {
    console.log('surplus', surplus)
    distributed = distributeSurplus(votes, counts[counts.length - 1], surplus);
    surplus = {};
  }

  let roundCounts = {};
  let roundElected = [];
  let hasElected = false;

  for (let v of hopefuls) {
    let count = 0;
    if (counts.length === 0) {
      count = countPref(1, v, votes);
    } else {
      count = distributed[v];
    }
    roundCounts[v] = count;
    if (count >= quota) {
      roundElected.push(v);
      elected.push(v);
      hopefuls = hopefuls.filter(e => e !== v);
    }
  }

  let excluded = [...elected, ...eliminated];
  if (roundElected.length === 0) {
    let elimCand = eliminate(votes, '', roundCounts, hopefuls, excluded,
    surplus, counts);
    eliminated.push(elimCand);
    hopefuls = hopefuls.filter(e => e !== elimCand);
    console.log('eliminated', eliminated);
  } else {
    roundElected.forEach(v => {
      console.log('elected', v)
      eliminate(votes, v, roundCounts, hopefuls, excluded,
        surplus, counts, roundCounts[v] - quota);
    });
  }

  counts.push(roundCounts);
  console.log('round count', roundCounts);
  console.log('round', counts.length);
  if (counts.length < 20) {} else {return;}
  return round(votes, seats, quota, hopefuls, eliminated, elected, counts,
    surplus);
}

function countSurplus(votes, candidate, hopefuls, excluded) {
  let surplus = {};
  let transferred = _.cloneDeep(votes).filter((val, ind, arr) => {
    if (val[0] === candidate) return true;
    return false;
  });
  let total = transferred.length;

  for (let exclude of excluded) {
    transferred.forEach((val, ind, arr) => {
      transferred[ind] = val.filter(e => e !== exclude);
    });
  }

  for (let hopeful of hopefuls) {
    surplus[hopeful] = countPref(1, hopeful, transferred);
  }

  return {
    dist: surplus,
    total,
  };
}
function distributeSurplus(votes, lastCounts, surplus) {
  let count = Object.assign({}, lastCounts);
  for (let candidate in surplus) {
    if (surplus.hasOwnProperty(candidate)) {
      let dist = surplus[candidate].dist;
      let value = 0;
      if (surplus[candidate].total !== 0) {
        value = surplus[candidate].surplus / surplus[candidate].total;
      }

      for (let transfer in dist) {
        if (dist.hasOwnProperty(transfer)) {
          count[transfer] += dist[transfer] * value;
          count[transfer] = count[transfer].round(PRECISION);
        }
      }
    }
  }
  return count;
}

function eliminate(votes, candidate, roundCounts, hopefuls, excluded,
surplus, counts, surplusVotes = 0) {
  if (candidate === '') {
    candidate = Object.keys(roundCounts);
    let minVotes = _.min(_.values(roundCounts));
    let potentials = [];
    candidate.forEach(function(val, ind) {
      if (roundCounts[val] === minVotes) {
        potentials.push(ind);
      }
    });
    if (potentials.length <= 0)
      console.error('case 1. unable to continue elimination');
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
    hopefuls = hopefuls.filter(e => e !== candidate);
  }

  surplus[candidate] = countSurplus(votes, candidate, hopefuls, excluded);
  surplus[candidate].surplus = surplusVotes || roundCounts[candidate];

  votes.forEach((val, ind, arr) => {
    votes[ind] = val.filter(e => e !== candidate);
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
    let lastCount = counts[counts.length - 1];
    let lastCounts = _.pick(lastCount, potentials);
    let minVotes = _.min(_.values(lastCounts));
    let potentialsTie = [];
    potentials.forEach(function(val, ind) {
      if (lastCounts[val] === minVotes) {
        potentialsTie.push(ind);
      }
    });
    if (potentialsTie.length <= 0)
      console.error('unable to continue elimination');
    if (potentialsTie.length === potentials.length) {
      return potentials[Math.floor(Math.random() * potentials.length)];
    }
    if (potentialsTie.length === 1) {
      return potentials[potentialsTie[0]];
    }
    let potentialCands = [];
    for (let ind in potentialsTie) {
      potentialCands.push(potentials[ind])
    }
    return breakTie(potentialCands, counts.slice(0, -1));
  }
}

function count({votes, candidates, seats, quota}) {
  if (quota < 0) quota = Math.floor(votes.length / (seats + 1) + 1);
  let result = round(votes, seats, quota, candidates, [], [], []);

  console.log('votes #:', votes.length);
  console.log('quota:', quota);
  console.log('counts:', result.counts);
  console.log('elected:', result.elected);
  return result;
}

let options = require('../options.json');
const PRECISION = options.precision || 6;
const Converter = require('csvtojson').Converter;
const converter = new Converter({});

converter.on('end_parsed', jsonArray => {
  let votes = [];
  let ind = 0;
  for (let vote of jsonArray) {
    vote = _.pickBy(vote, _.identity);
    let voteArray = Object.keys(vote).sort((a, b) => vote[a] - vote[b]);
    let temp = [];
    for (let i of voteArray)
      i && temp.push(i);

    voteArray = temp;
    votes[ind++] = voteArray;
  }
  options.votes = votes;
  count(options);
});

require('fs').createReadStream('./votes.csv').pipe(converter);
