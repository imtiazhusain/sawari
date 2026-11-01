import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import DriverPage from './pages/DriverPage';
import RiderPage from './pages/RiderPage';

const link = ({ isActive }: { isActive: boolean }) => {
  return `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-pine-tint text-pine-dark' : 'text-ink-soft hover:text-ink'}`;
};

export default function App() {
  return (
    <>
      <header
        className="flex h-16 items-center justify-between border-b border-line bg-surface px-5 sm:px-8"
      >
        <span className="font-display text-xl font-bold tracking-tight">
          Sawari <span className="font-sans text-sm font-medium text-ink-faint">
            Lahore
          </span>
        </span>
        <nav aria-label="Main" className="flex gap-1">
          <NavLink
            to="/"
            end
            className={link}
          >
            Ride
          </NavLink>
          <NavLink to="/driver" className={link}>
            Driver
          </NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<RiderPage />} />
          <Route path="/driver" element={<DriverPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
