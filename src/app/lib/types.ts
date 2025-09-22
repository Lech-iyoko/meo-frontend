export interface Source {
  source_name: string;
  // original_url can be undefined or null depending on downstream data; accept both
  original_url?: string | null;
  // page_number can be undefined or null
  page_number?: number | null;
}

export type Sender = 'user' | 'meo';

export interface Message {
  text: string;
  sender: Sender;
  sources?: Source[];
}