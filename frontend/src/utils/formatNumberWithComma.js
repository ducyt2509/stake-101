export const formatNumberWithComma = (number) => {
  // Chuyển số thành chuỗi và loại bỏ phần thập phân nếu có
  const numberString = Number(number).toFixed(0);

  // Định dạng số với dấu phân cách hàng nghìn
  const number1 = numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ',').toString();
  return number1;
};
