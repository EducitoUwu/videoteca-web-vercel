export interface Category {
  id: string;
  name: string;
}

export interface Video {
  id: string;
  title: string;
  fileKey: string;
  fileUrl: string;
  contentType: string;
  fileSize: number;
  description: string;
  createdAt: string;
  category?: Category; // 👈 importante
}
