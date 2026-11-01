import { Rider } from '../models/Rider.js';
// Find an existing rider by phone or create a new one (temporary auth just for task).
export async function upsertRider(input) {
   // Create rider if not found; preserve the existing name if already registered.
  const run = () =>
    Rider.findOneAndUpdate({ phone: input.phone }, { $setOnInsert: { name: input.name } }, { upsert: true, new: true });
  try {
    return await run();
  } catch (err) {
     // Handle concurrent requests trying to create a rider with the same phone.
    // If a duplicate-key error occurs, retry to fetch the existing rider.
    if (err.code === 11000) return run();

    // Propagate any other database errors.
    throw err;
  }
}
