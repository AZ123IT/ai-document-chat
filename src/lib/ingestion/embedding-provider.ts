export const EMBEDDING_DIMENSIONS = 1536;

export type EmbeddingProvider = {
  embedDocuments(texts: string[]): Promise<number[][]>;
};

export type QueryEmbeddingProvider = {
  embedQuery(text: string): Promise<number[]>;
};

export function createPlaceholderEmbeddingProvider(
  dimensions = EMBEDDING_DIMENSIONS,
): EmbeddingProvider & QueryEmbeddingProvider {
  return {
    async embedDocuments(texts) {
      return texts.map((text, index) =>
        createPlaceholderEmbedding(text, index, dimensions),
      );
    },
    async embedQuery(text) {
      return createPlaceholderEmbedding(text, 0, dimensions);
    },
  };
}

function createPlaceholderEmbedding(
  text: string,
  index: number,
  dimensions: number,
) {
  const embedding = Array.from({ length: dimensions }, () => 0);
  embedding[0] = Math.max(text.length, 1) / 1000;
  embedding[1] = (index + 1) / 1000;

  return embedding;
}
