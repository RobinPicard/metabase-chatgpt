// Function to compute dot product of two vectors
function dotProduct(vecA, vecB) {
  let product = 0;
  for (let i = 0; i < vecA.length; i++) {
      product += vecA[i] * vecB[i];
  }
  return product;
}

// Function to compute magnitude of a vector
function magnitude(vec) {
  let sumSquare = 0;
  for (let i = 0; i < vec.length; i++) {
      sumSquare += vec[i] * vec[i];
  }
  return Math.sqrt(sumSquare);
}

// Function to compute cosine similarity
function computeCosineSimilarity(vecA, vecB) {
  let dotProductAB = dotProduct(vecA, vecB);
  let magnitudeA = magnitude(vecA);
  let magnitudeB = magnitude(vecB);

  return dotProductAB / (magnitudeA * magnitudeB);
}

export default computeCosineSimilarity
