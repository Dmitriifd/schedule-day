const formatTime = (hour: number) => {
  const start = `${hour.toString().padStart(2, '0')}:00`;
  const end = `${((hour + 1) % 24).toString().padStart(2, '0')}:00`;
  return `${start} - ${end}`;
};

export { formatTime };
