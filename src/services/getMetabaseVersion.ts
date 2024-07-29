// Extension tested with 0.45.1 + 0.46.1 + 0.48.2 + 0.49.1 + 0.49.13 + 0.50.1 + 0.50.13 

async function getMetabaseVersion() : Promise<[number, number]> {
  const defaultVersion : [number, number] = [50, 13];
  try {
    const response = await fetch("api/session/properties");
    if (!response.ok) {
      throw new Error('Failed to fetch API version');
    }
    const data = await response.json();
    const apiVersion = data?.version?.tag;
    if (!apiVersion) {
      return defaultVersion;
    }
    const versionRegex = /^v(\d+)\.(\d+)\.?(\d+)?$/;  // Made the last group optional
    const match = apiVersion.match(versionRegex);
    if (match) {
      const minor = parseInt(match[2], 10);
      const patch = parseInt(match[3] || '0', 10);  // Default patch to 0 if not present
      return [minor, patch] as [number, number];
    }
  } catch (error) {
    console.error("Error fetching or parsing version:", error);
  }
  return defaultVersion;  // Ensures a default return if no other returns have been hit
}

export default getMetabaseVersion;
