import React from 'react';

interface CalendarDayProps {
  day: number;
  status?: "available" | "booked" | "pending";
}

function CalendarDay({ day, status }: CalendarDayProps) {
  return (
    <div 
      className={`
        h-10 w-10 flex items-center justify-center rounded-full
        ${status === "available" ? "bg-green-100 text-green-700" : 
          status === "booked" ? "bg-red-100 text-red-700" : 
          status === "pending" ? "bg-amber-100 text-amber-700" : 
          "bg-transparent"}
      `}
    >
      {day}
    </div>
  );
}

const CalendarOverview = () => {
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  // Generate days in month - this is a simplified version
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  
  // Sample availability data - in a real app, this would come from API
  const availability = {
    // format: day: status
    1: "available",
    2: "available",
    3: "available",
    4: "booked",
    5: "booked",
    6: "booked",
    7: "available",
    8: "available",
    9: "available",
    10: "available",
    11: "available",
    12: "available",
    13: "pending",
    14: "pending",
    15: "available",
    16: "available",
    17: "available",
    18: "booked",
    19: "booked",
    20: "booked",
    21: "booked",
    22: "available",
    23: "available",
    24: "available",
    25: "available",
    26: "available",
    27: "available",
    28: "available",
    29: "booked",
    30: "booked",
    31: "booked",
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium">{currentMonth} {currentYear}</h4>
        <div className="flex items-center space-x-2">
          <button className="p-1 rounded hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"></path>
            </svg>
          </button>
          <button className="p-1 rounded hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-xs font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {/* First day offset - for simplicity assuming month starts on Sunday */}
        {daysInMonth.map((day) => (
          <div key={day} className="flex justify-center py-1">
            <CalendarDay 
              day={day} 
              status={availability[day] as CalendarDayProps['status']}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarOverview;