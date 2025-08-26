export interface Source {
    source_name: string;
    original_url: string | null;
    page_number: number | null;
}

export interface Message {
  text: string;
  sender: 'user' | 'meo';
  sources?: Source[];
}