import { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface VKUploadResponse {
  server: number;
  photo: string;
  hash: string;
}

export interface VKSavePhotoResponse {
  response: Array<{
    id: number;
    owner_id: number;
    access_key?: string;
  }>;
}

export interface VKSaveDocResponse {
  response: {
    doc: {
      id: number;
      owner_id: number;
      title: string;
    }
  };
}

export type ApiResponse<T> = AxiosResponse<T>;
export type ApiConfig = AxiosRequestConfig;