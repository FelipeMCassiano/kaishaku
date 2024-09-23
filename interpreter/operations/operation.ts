export const getOperation = (x: string): OPERATIONS => {
  return OPERATIONS[x as keyof typeof OPERATIONS];
};
