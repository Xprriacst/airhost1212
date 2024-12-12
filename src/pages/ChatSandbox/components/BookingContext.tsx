import React from 'react';
import { Calendar, User } from 'lucide-react';
import SpecialRequests from './SpecialRequests';

interface BookingContextProps {
  checkIn: string;
  checkOut: string;
  guestCount: number;
  specialRequests: string[];
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  onGuestCountChange: (count: number) => void;
  onSpecialRequestsChange: (requests: string[]) => void;
}

const BookingContext: React.FC<BookingContextProps> = ({
  checkIn,
  checkOut,
  guestCount,
  specialRequests,
  onCheckInChange,
  onCheckOutChange,
  onGuestCountChange,
  onSpecialRequestsChange,
}) => {
  return (
    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <div>
            <label className="block text-sm text-gray-700">Check-in</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => onCheckInChange(e.target.value)}
              className="mt-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <div>
            <label className="block text-sm text-gray-700">Check-out</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => onCheckOutChange(e.target.value)}
              className="mt-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-gray-400" />
          <div>
            <label className="block text-sm text-gray-700">Nombre d'invités</label>
            <input
              type="number"
              value={guestCount}
              onChange={(e) => onGuestCountChange(parseInt(e.target.value))}
              min="1"
              className="mt-1 w-20 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <SpecialRequests
          requests={specialRequests}
          onChange={onSpecialRequestsChange}
        />
      </div>
    </div>
  );
};

export default BookingContext;