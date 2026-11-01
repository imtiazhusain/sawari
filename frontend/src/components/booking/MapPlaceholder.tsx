import type { Place, RideLocation } from '../../types';

type Point = Pick<Place, 'lat' | 'lng'> | RideLocation;

const BOUNDS = { minLat: 31.3, maxLat: 31.7, minLng: 74.1, maxLng: 74.55 };

const W = 450;

const H = 400;

const project = (p: Point) => {
  return ({
    x: ((p.lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * W,
    y: (1 - (p.lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * H,
  });
};

interface Props {
  places?: Place[];
  pickup: Point | null;
  destination: Point | null;
  driver?: Point | null;
}

/** Stand-in for a real map: projects Lahore's bounding box onto an SVG so the trip is still visualised. */
export function MapPlaceholder({ places = [], pickup, destination, driver }: Props) {
  const a = pickup && project(pickup);
  const b = destination && project(destination);
  const d = driver && project(driver);

  return (
    <div
      className="relative h-full min-h-[16rem] w-full overflow-hidden bg-[#dfe8e5]"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="Schematic map of Lahore with your trip"
      >
        <g stroke="#cdd9d5" strokeWidth="1">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => {
            return (
              <line
                key={`v${i}`}
                x1={(W / 8) * i}
                y1="0"
                x2={(W / 8) * i}
                y2={H}
              />
            );
          })}
          {[1, 2, 3, 4, 5, 6].map((i) => {
            return (
              <line
                key={`h${i}`}
                x1="0"
                y1={(H / 7) * i}
                x2={W}
                y2={(H / 7) * i}
              />
            );
          })}
        </g>
        <path
          d="M-10 70 C 90 40, 160 110, 250 60 S 390 20, 470 55"
          fill="none"
          stroke="#b6d3e0"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {places.map((pl) => {
          const { x, y } = project(pl);

          return (
            <circle
              key={pl.id}
              cx={x}
              cy={y}
              r="2.5"
              fill="#9bb0aa"
            />
          );
        })}
        {a && b && (
          <line
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#12211d"
            strokeWidth="2.5"
            strokeDasharray="7 6"
          />
        )}
        {d && (
          <path d={`M${d.x} ${d.y - 9} l8 14 h-16 z`} fill="#12211d" />
        )}
        {a && (
          <circle
            cx={a.x}
            cy={a.y}
            r="9"
            fill="#0d6b52"
            stroke="#fff"
            strokeWidth="3"
          />
        )}
        {b && (
          <rect
            x={b.x - 8}
            y={b.y - 8}
            width="16"
            height="16"
            fill="#f2b233"
            stroke="#fff"
            strokeWidth="3"
          />
        )}
      </svg>
      <p
        className="absolute bottom-3 left-3 rounded bg-white/85 px-2 py-1 text-xs text-ink-soft"
      >
        Dummy live map
      </p>
    </div>
  );
}
