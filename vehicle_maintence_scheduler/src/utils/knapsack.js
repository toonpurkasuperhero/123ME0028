function solveKnapsack(vehicles, budget) {
  const n = vehicles.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(budget + 1));
  for (let i = 1; i <= n; i++) {
    const { Duration: w, Impact: v } = vehicles[i - 1];
    for (let cap = 0; cap <= budget; cap++) {
      dp[i][cap] = dp[i - 1][cap];
      if (w <= cap && dp[i - 1][cap - w] + v > dp[i][cap]) {
        dp[i][cap] = dp[i - 1][cap - w] + v;
      }
    }
  }
  const selectedTasks = [];
  let remainingCap = budget;
  for (let i = n; i > 0; i--) {
    if (dp[i][remainingCap] !== dp[i - 1][remainingCap]) {
      selectedTasks.push(vehicles[i - 1]);
      remainingCap -= vehicles[i - 1].Duration;
    }
  }
  return {
    totalImpact: dp[n][budget],
    hoursUsed: budget - remainingCap,
    hoursRemaining: remainingCap,
    selectedTasks: selectedTasks.reverse(), 
  };
}
module.exports = { solveKnapsack };