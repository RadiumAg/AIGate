// 获取今日日期字符串，或者指定的日期
// 修复时区问题，使用本地时间而非UTC时间
export const getTodayString = (date?: Date) => {
  const finalDate = date || new Date();
  // 使用getFullYear, getMonth, getDate来获取本地日期，避免时区问题
  const year = finalDate.getFullYear();
  const month = String(finalDate.getMonth() + 1).padStart(2, '0');
  const day = String(finalDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 获取当前分钟字符串
export const getCurrentMinuteString = () => {
  const now = new Date();
  return `${now.toISOString().split('T')[0]}:${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};
