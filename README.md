stvCount
========
This is an counter for single transferable vote (STV) electoral system, written
in Javascript.

It is designed for the use of Reddit Model World
([/r/cmhoc](https://reddit.com/r/cmhoc) and
[/r/MHoC](https://reddit.com/r/mhoc)).

It roughly follows the Scottish system whereas:

1. Droop quota is used; every candidate who reaches the quota is elected. Other
quota may be configured.
2. The surplus vote is not transferred to elected candidates but rather to the
next preferred candidate on the ballot (who is neither elected nor eliminated).
3. For each elected candidate that exceeds the quota, every vote for that
candidate, including votes transferred to the candidate, is transferred to the
next preferred candidate (who is neither elected nor eliminated) at a value
equal to the ratio of the surplus votes to the total number of votes.
4. A tie is broken in favour of the candidate with the highest number of votes
in the last earlier round without tie. If the tie cannot be broken because all
preceding rounds are tied, the tie is broken randomly.

Usage
-------
[Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) are required.

```
npm install
node build/all.js
```

### `options.json`
``` json
{
  "seats": 2,
  "candidates": ["candidate1", "candidate2", "candidate3"],
  "quota": -1,
  "precision": 6
}
```
* **seats**: number of seats available. The counting ends when all seats are
filled.
- **candidates**: list of candidates. The names in the list must match the
headers in the `.csv` file.
- **quota**: quota used to declare someone elected. When set below 0, the Droop
quota is used; otherwise the quota is fixed at the given non-negative value
- **precision**: the precision for fractional vote transfer. default is 6, i.e.
the votes are transferred at its value rounded to six decimal places.

### `votes.csv`
This `.csv` file is used to import votes collected through table-format ranking,
e.g. Google Forms.

The first row lists all candidates ranked, followed by ballots. A ballot is
comprised of rankings for the coressponding candidates in the first row.

For example,
``` csv
candidate1, candidate2, candidate3
1,2,3
2,3,1
1,3,2
1,2,3
```

Here, three voters (1st, 3rd and 4th ballot) ranked `candidate1` as their first
preference. `candidate2` is ranked the first on the second ballot.


Copyright & Licence
-------
Copyright (c) 2016 Z. Tong Zhang

Licensed under MIT, see `LICENSE`.
