import React, { createContext, useContext, useState } from 'react';

interface TimeContextType {
  utcOffset: number;
  setUtcOffset: (offset: number) => void;
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);

export const TimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Intentar cargar el offset desde localStorage o usar -3 por defecto (Argentina)
  const [utcOffset, setUtcOffsetState] = useState<number>(() => {
    const saved = localStorage.getItem('utcOffset');
    return saved !== null ? parseInt(saved, 10) : -3;
  });

  const setUtcOffset = (offset: number) => {
    setUtcOffsetState(offset);
    localStorage.setItem('utcOffset', offset.toString());
  };

  return (
    <TimeContext.Provider value={{ utcOffset, setUtcOffset }}>
      {children}
    </TimeContext.Provider>
  );
};

export const useTime = () => {
  const context = useContext(TimeContext);
  if (context === undefined) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
};
