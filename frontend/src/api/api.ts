import axios from "axios";
import type { Item, Company, Category, CompanyRole } from "../types";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const createItem = async (data: ItemCreate) => {
  return api.post("/items/", data);
};

export const fetchItems = async (): Promise<Item[]> => {
  const res = await api.get("/items/");
  return res.data;
};

export type CompanyFilter = {
  role?: "supplier" | "manufacturer";
  search?: string;
};

export async function fetchCompanies(
  filter?: CompanyFilter
): Promise<Company[]> {
  const res = await api.get("/companies", {
    params: filter,
  });
  return res.data;
}

export const fetchCategories = async (): Promise<Category[]> => {
  const res = await api.get("/categories");
  return res.data;
};

export const setItemActive = (id: number, active: boolean) =>
  api.patch(`/items/${id}/active`, { is_active: active });

export const uploadCompanyLogo = async (
  companyId: number,
  file: File
) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(`/companies/${companyId}/logo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteCompanyLogo = async (companyId: number) => {
  return api.delete(`/companies/${companyId}/logo`);
};
