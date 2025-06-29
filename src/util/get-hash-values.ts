export function getHashValues(hash = window.location.hash) {
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const pairs = cleanHash.split('&');
  const result: any = {};

  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) result[decodeURIComponent(key)] = decodeURIComponent(value);
  });

  return result;
}