// bot/engine.js
import { runCycle, loadState } from '../lib/trading.js';

async function loopOnce(universe) {
  console.log(new Date().toISOString(), 'Starting cycle for', universe.join(','));
  const res = await runCycle(universe);
  console.log(new Date().toISOString(), 'Executed trades:', res.executed.length, 'balance:', res.balance);
  return res;
}

async function main() {
  const universe = ['bitcoin','ethereum','litecoin','ripple','dogecoin','binancecoin','cardano','polkadot','tron','chainlink'];
  const arg = process.argv[2];
  if (arg === 'single') {
    await loopOnce(universe);
    return process.exit(0);
  }
  // continuous run: every 5 minutes
  while (true) {
    try {
      await loopOnce(universe);
    } catch (err) {
      console.error('Engine error:', err?.message || err);
    }
    // sleep 5 minutes
    await new Promise(r => setTimeout(r, 5 * 60 * 1000));
  }
}

main();
