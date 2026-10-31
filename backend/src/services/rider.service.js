import { Rider } from '../models/Rider.js';
/** Find-or-create by phone. Stand-in for sign-up/sign-in until real auth exists. */
export async function upsertRider(input) {
  const run = () =>
    Rider.findOneAndUpdate({ phone: input.phone }, { $setOnInsert: { name: input.name } }, { upsert: true, new: true });
  try {
    return await run();
  } catch (err) {
    // Two first-time requests can race on the unique phone index; the loser simply re-reads.
    if (err.code === 11000) return run();
    throw err;
  }
}
