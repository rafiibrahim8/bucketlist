export interface BreadcrumbEntry {
  name: string;
  path: string;
}

export const getBreadcrumb = (path: string): BreadcrumbEntry[] => {
  const parts = path.replace(/\/$/, '').split('/');
  return parts.map((part, index) => {
    return {
      name: part || '/',
      path: '../'.repeat(parts.length - index - 1),
    };
  });
};
