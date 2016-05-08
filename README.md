stvCount
========
This an counter for single transferable vote (STV) electoral system.

It is designed for the use of Reddit Model World
([/r/cmhoc](https://reddit.com/r/cmhoc) and
[/r/MHoC](https://reddit.com/r/mhoc)).

It roughly follows the Wright system whereas:
1. Droop quota is used; every candidate who reaches the quota is elected.
2. The surplus vote is not transferred to elected candidates but rather to the
next preferred candidate on the ballot (who is neither elected nor eliminated).
3. For each elected candidate that exceeds the quota, every vote for that
candidate, including votes transferred to the candidate, is transferred to the
next preferred candidate (who is neither elected nor eliminated) at a value
equal to the ratio of the surplus votes to the total number of votes.

Licensed under MIT, see `LICENSE`.
