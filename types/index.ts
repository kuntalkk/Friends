export interface User {
  id: string;
  name: string;
  dob: string;
}

export interface AlbumItem {
  id: string;
  url: string;
  uploaderName: string;
  timestamp: number;
  type: "image" | "video";
}