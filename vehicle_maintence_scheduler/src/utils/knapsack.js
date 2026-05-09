const optimize = (items, maxWeight) => {
  const n = items.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(maxWeight + 1));
  
  for (let i = 1; i <= n; i++) {
    const { Duration: w, Impact: v } = items[i - 1];
    for (let c = 0; c <= maxWeight; c++) {
      dp[i][c] = dp[i - 1][c];
      if (w <= c && dp[i - 1][c - w] + v > dp[i][c]) {
        dp[i][c] = dp[i - 1][c - w] + v;
      }
    }
  }
  
  const result = [];
  let currentCap = maxWeight;
  
  for (let i = n; i > 0; i--) {
    if (dp[i][currentCap] !== dp[i - 1][currentCap]) {
      result.push(items[i - 1]);
      currentCap -= items[i - 1].Duration;
    }
  }
  
  return {
    impact: dp[n][maxWeight],
    used: maxWeight - currentCap,
    remaining: currentCap,
    selected: result.reverse(),
  };
};

module.exports = { optimize };