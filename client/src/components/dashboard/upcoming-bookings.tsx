import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Booking } from '@shared/schema';

interface UpcomingBookingsProps {
  limit?: number;
}

const UpcomingBookings = ({ limit = 5 }: UpcomingBookingsProps) => {
  const [, setLocation] = useLocation();
  
  const { data: bookings = [], isLoading, error } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    select: (data) => {
      // Filter for upcoming bookings (future start dates)
      const now = new Date();
      const upcoming = data.filter(booking => new Date(booking.startDate) > now);
      // Sort by start date (earliest first)
      return upcoming.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }
  });
  
  // Get only the first 'limit' number of bookings
  const limitedBookings = bookings.slice(0, limit);
  
  const handleViewBooking = (bookingId: number) => {
    setLocation(`/dashboard/bookings?booking=${bookingId}`);
  };
  
  const handleViewAllBookings = () => {
    setLocation('/dashboard/bookings');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center py-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500">
        Failed to load upcoming bookings
      </div>
    );
  }

  if (limitedBookings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No upcoming bookings
      </div>
    );
  }
  
  // Format date as "May 20, 2025"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium text-sm">Booking ID</th>
              <th className="text-left py-3 px-4 font-medium text-sm">Guest</th>
              <th className="text-left py-3 px-4 font-medium text-sm">Check In</th>
              <th className="text-left py-3 px-4 font-medium text-sm">Check Out</th>
              <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
              <th className="text-right py-3 px-4 font-medium text-sm">Amount</th>
              <th className="text-right py-3 px-4 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {limitedBookings.map((booking) => (
              <tr key={booking.id} className="border-b">
                <td className="py-4 px-4 text-sm">BK-{booking.id}</td>
                <td className="py-4 px-4 text-sm font-medium">{booking.customerName}</td>
                <td className="py-4 px-4 text-sm">{formatDate(booking.startDate)}</td>
                <td className="py-4 px-4 text-sm">{formatDate(booking.endDate)}</td>
                <td className="py-4 px-4 text-sm">
                  <span 
                    className={`
                      inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                      ${booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : booking.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : booking.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                      }
                    `}
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-right">${booking.totalPrice.toFixed(2)}</td>
                <td className="py-4 px-4 text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleViewBooking(booking.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {limit < bookings.length && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={handleViewAllBookings}>View All Bookings</Button>
        </div>
      )}
    </div>
  );
};

export default UpcomingBookings;