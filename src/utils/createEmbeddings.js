async function createEmbeddings(schema, model) {
  for (const database_id in schema) {
    // We call the embedding model by batch to avoid crashing the browser
    let embeddingData = []
    const batchSize = 20;
    for(let i = 0; i < schema[database_id].length; i += batchSize){
        let batch = schema[database_id].slice(i, i+batchSize);
        const embeddings = await model.embed(batch.map(row => row.short));
        embeddingData.push(...embeddings.arraySync());
    }
    schema[database_id].map((obj, index) => {
      obj.embedding = embeddingData[index];
    });
  }
  return schema
}

export default createEmbeddings
