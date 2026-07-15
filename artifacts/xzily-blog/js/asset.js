// Resolves a root-relative asset path (e.g. "images/cover-1.jpg") for use
// from within a nested directory such as /admin/. Leaves external URLs and
// already-relative paths untouched.
export function toAdminAsset(path) {
  if (!path) return path;
  if (/^https?:\/\//.test(path) || path.startsWith('../') || path.startsWith('./') || path.startsWith('data:')) {
    return path;
  }
  return '../' + path.replace(/^\//, '');
}
