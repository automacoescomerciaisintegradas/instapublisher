export type ContentType = 'text' | 'image' | 'video' | 'document';

export interface VectorMetadata {
  id: string;
  type: ContentType;
  title: string;
  source?: string;
  tags?: string[];
  createdAt: string;
  originalContent?: string;
  mimeType?: string;
}

export interface VectorEntry {
  metadata: VectorMetadata;
  embedding: number[];
}

export interface SearchResult extends VectorEntry {
  similarity: number;
}
