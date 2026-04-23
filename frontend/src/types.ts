export interface User {
  id: number;
  username: string;
  email?: string;
}

export interface Comment {
  id: number;
  content: string;
  user_id: number;
  parent_id: number | null;
  created_at: string;
  user: User;
}

export interface APIAnnotation {
  id: number;
  selected_text: string;
  initial_comment: string;
  created_at: string;
  comments: Comment[];
  url: string;
  text_selector: string;
}
