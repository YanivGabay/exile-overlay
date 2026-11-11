import { compareSplit, formatDuration } from "../../../shared/timer.js";
import type { AppState } from "../../../shared/types.js";

export function RunsTable({ state }: { state: AppState }) {
  const runs = state.settings.runs ?? [];
  if (!runs.length)
    return (
      <p className="muted small">
        Finish a campaign that started in The Twilight Strand and its act times show here, as best, previous and average splits.
      </p>
    );
  const acts = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return (
    <table className="table">
      <thead>
        <tr>
          <td>Reached</td>
          <td>Best</td>
          <td>Previous</td>
          <td>Average</td>
        </tr>
      </thead>
      <tbody>
        {acts.map((a) => {
          const c = compareSplit(runs, a);
          if (c.best === null) return null;
          return (
            <tr key={a}>
              <td>{a === 11 ? "Campaign done" : `Act ${a}`}</td>
              <td>{formatDuration(c.best)}</td>
              <td>{formatDuration(c.previous!)}</td>
              <td>{formatDuration(c.average!)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
