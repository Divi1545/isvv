import React from 'react';

interface ServiceProps {
  type: string;
  percentage: number;
  icon: string;
  color: {
    bg: string;
    text: string;
  };
}

interface ServiceBreakdownProps {
  services: ServiceProps[];
}

const ServiceBreakdown = ({ services }: ServiceBreakdownProps) => {
  return (
    <div className="space-y-4">
      {services.map((service, index) => (
        <div key={index} className="flex items-center">
          <div className={`w-10 h-10 rounded-full ${service.color.bg} flex items-center justify-center mr-3`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={service.color.text}>
              {service.icon === "building" && (
                <>
                  <rect width="14" height="21" x="5" y="3" rx="2" ry="2"></rect>
                  <path d="M9 9h1"></path>
                  <path d="M9 13h1"></path>
                  <path d="M9 17h1"></path>
                  <path d="M14 9h1"></path>
                  <path d="M14 13h1"></path>
                  <path d="M14 17h1"></path>
                </>
              )}
              {service.icon === "car" && (
                <>
                  <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"></path>
                  <circle cx="6.5" cy="16.5" r="2.5"></circle>
                  <circle cx="16.5" cy="16.5" r="2.5"></circle>
                </>
              )}
              {service.icon === "map" && (
                <>
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                  <line x1="9" x2="9" y1="3" y2="18"></line>
                  <line x1="15" x2="15" y1="6" y2="21"></line>
                </>
              )}
              {service.icon === "heart" && (
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
              )}
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <p className="text-sm font-medium">{service.type}</p>
              <p className="text-sm font-medium">{service.percentage}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  service.icon === "building" ? "bg-blue-500" : 
                  service.icon === "car" ? "bg-green-500" : 
                  service.icon === "map" ? "bg-amber-500" : 
                  "bg-rose-500"
                }`} 
                style={{ width: `${service.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceBreakdown;