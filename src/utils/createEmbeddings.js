async function createEmbeddings(schema, model) {
  for (const database_id in schema) {
    const embeddings = await model.embed(schema[database_id].map(row => row.short))
    const embeddingData = embeddings.arraySync();
    schema[database_id].map((obj, index) => {
      obj.embedding = embeddingData[index];
    });
  }
  return schema
}

export default createEmbeddings
