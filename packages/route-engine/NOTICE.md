# Notice

`src/route-processing/` and `src/types.ts` are derived from
[exile-leveling](https://github.com/HeartofPhos/exile-leveling) (`common/src`),
Copyright (c) 2025 HeartofPhos, MIT License.

Changes: game data is injected through `RouteState.data` instead of static JSON
imports; the logger returns its messages instead of printing them; step ids,
compile and progress helpers were added in `src/guide.ts` and `src/progress.ts`.
