import { connectDb, disconnectDb } from '../config/db.js';
import { Driver } from '../models/Driver.js';
import { toPoint } from '../models/shared.js';
import { PLACES } from '../services/places.service.js';
import { logger } from '../utils/logger.js';
const place = (id) => PLACES.find((p) => p.id === id);
const near = (id, dLat, dLng) => ({ lat: place(id).lat + dLat, lng: place(id).lng + dLng });
const DRIVERS = [
  {
    name: 'Usman Tariq',
    category: 'economy',
    model: 'Suzuki Cultus',
    plate: 'LEA-1021',
    at: near('liberty-market', 0.004, 0.003),
  },
  {
    name: 'Bilal Ahmed',
    category: 'economy',
    model: 'Suzuki Alto',
    plate: 'LEB-4412',
    at: near('gaddafi-stadium', -0.003, 0.004),
  },
  {
    name: 'Hamza Raza',
    category: 'economy',
    model: 'Toyota Vitz',
    plate: 'LED-7730',
    at: near('packages-mall', 0.005, -0.004),
  },
  {
    name: 'Saad Mehmood',
    category: 'economy',
    model: 'Suzuki Wagon R',
    plate: 'LEC-2284',
    at: near('model-town', 0.004, 0.002),
  },
  {
    name: 'Faisal Iqbal',
    category: 'economy',
    model: 'Suzuki Cultus',
    plate: 'LEE-9051',
    at: near('mall-road', -0.004, 0.003),
  },
  {
    name: 'Kamran Butt',
    category: 'economy',
    model: 'Toyota Passo',
    plate: 'LEF-3318',
    at: near('johar-town', 0.003, -0.003),
  },
  {
    name: 'Zeeshan Malik',
    category: 'comfort',
    model: 'Honda City',
    plate: 'LEG-5502',
    at: near('liberty-market', -0.005, -0.003),
  },
  {
    name: 'Adeel Hussain',
    category: 'comfort',
    model: 'Toyota Corolla',
    plate: 'LEH-6127',
    at: near('dha-phase-5', 0.004, 0.003),
  },
  {
    name: 'Rizwan Shah',
    category: 'comfort',
    model: 'Honda Civic',
    plate: 'LEJ-8843',
    at: near('packages-mall', -0.004, 0.004),
  },
  {
    name: 'Naveed Anwar',
    category: 'comfort',
    model: 'Toyota Yaris',
    plate: 'LEK-1976',
    at: near('airport', 0.003, -0.003),
  },
  {
    name: 'Tahir Javed',
    category: 'comfort',
    model: 'Honda City',
    plate: 'LEL-4059',
    at: near('mall-road', 0.004, -0.002),
  },
  {
    name: 'Imran Sheikh',
    category: 'comfort',
    model: 'Kia Picanto',
    plate: 'LEM-2630',
    at: near('johar-town', -0.003, 0.003),
  },
];
async function main() {
  await connectDb();
  for (const [i, d] of DRIVERS.entries()) {
    await Driver.findOneAndUpdate(
      { phone: `+92300555${String(1000 + i)}` },
      {
        $set: {
          name: d.name,
          category: d.category,
          vehicle: { model: d.model, plate: d.plate },
          status: 'available',
          currentRide: null,
          location: toPoint(d.at),
        },
      },
      { upsert: true },
    );
  }
  logger.info({ drivers: DRIVERS.length }, 'seeded drivers');
  await disconnectDb();
}
main().catch((err) => {
  logger.error({ err }, 'seed failed');
  process.exit(1);
});
