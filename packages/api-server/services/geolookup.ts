export async function ipToCountry(ip: string): Promise<string> {
  const resp = await fetch(`https://api.country.is/${ip}`);
  const { error, country } = await resp.json();
  if (error)
    throw new Error(`ip-country lookup error: ${error.code}: ${error.message}`);
  return country as string;
}
