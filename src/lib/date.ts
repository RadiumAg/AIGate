// 获取今日日期字符串，或者指定的日期

export const getTodayString = (date?: Date) => {
  const finalDate = date || new Date();
  return finalDate.toISOString().split('T')[0];
};

// 获取当前分钟字符串
export const getCurrentMinuteString = () => {
  const now = new Date();
  return `${now.toISOString().split('T')[0]}:${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};
