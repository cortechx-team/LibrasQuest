export function getApiUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
  const fallbackUrl = `${window.location.protocol}//${window.location.hostname}:8000`;
  return (configuredUrl ?? fallbackUrl).replace(/\/$/, '');
}
