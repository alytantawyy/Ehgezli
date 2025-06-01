import React, { createContext, useContext, useState, ReactNode } from 'react';
import { format } from 'date-fns';

type DateTimeContextType = {
  selectedDate: Date;
  selectedTime: string;
  setSelectedDate: (date: Date) => void;
  setSelectedTime: (time: string) => void;
  formattedDate: string; // YYYY-MM-DD format
};

const DateTimeContext = createContext<DateTimeContextType | undefined>(undefined);

export const DateTimeProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(format(new Date(), 'HH:mm'));

  // Formatted date for API calls
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');

  return (
    <DateTimeContext.Provider
      value={{
        selectedDate,
        selectedTime,
        setSelectedDate,
        setSelectedTime,
        formattedDate
      }}
    >
      {children}
    </DateTimeContext.Provider>
  );
};

export const useDateTimeContext = () => {
  const context = useContext(DateTimeContext);
  if (context === undefined) {
    throw new Error('useDateTimeContext must be used within a DateTimeProvider');
  }
  return context;
};
