export default function sum(...nums: number[]) {
  return nums.reduce((acc, cur) => acc + cur, 0)
}
