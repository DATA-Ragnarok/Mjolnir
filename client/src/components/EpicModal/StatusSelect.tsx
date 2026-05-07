import React from 'react';
import { Status } from '../../types';
import { STATUS_CONFIG } from '../../constants/status';

type StatusSelectProps = {
  status: Status;
  setStatus: (status: Status) => void;
};

const StatusSelect: React.FC<StatusSelectProps> = ({ status, setStatus }) => {
  const currentStatus = STATUS_CONFIG[status];

  return (
    <div>
      <label htmlFor="status" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
        Status
      </label>
      <div className="relative">
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className={`w-full appearance-none border-2 rounded-xl py-3 pl-12 pr-10 focus:outline-none transition-all duration-300 font-bold ${currentStatus.border} ${currentStatus.light} ${currentStatus.text}`}
        >
          {Object.keys(STATUS_CONFIG).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          {React.createElement(currentStatus.icon, { size: 18, className: currentStatus.text })}
        </div>
      </div>
    </div>
  );
};

export default StatusSelect;
