export const kebabCase = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/([a-z0-9])(?=[A-Z])/g, '$1-')
    .toLowerCase();
