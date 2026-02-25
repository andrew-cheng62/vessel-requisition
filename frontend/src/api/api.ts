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

// ── Items ────────────────────────────────────────────────────────────────────

export type ItemFilter = {
  search?: string;
  category_id?: number;
  manufacturer_id?: number;
  supplier_id?: number;
  page?: number;
  page_size?: number;
  is_active?: boolean;
};

export type PaginatedItems = {
  items: Item[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

// FIX: was returning res.data directly (Item[]), but /items returns a paginated object
export const fetchItems = async (filter?: ItemFilter): Promise<PaginatedItems> => {
  const res = await api.get("/items/", { params: filter });
  return res.data;
};

// ── Companies ────────────────────────────────────────────────────────────────

export type CompanyFilter = {
  role?: "supplier" | "manufacturer";
  search?: string;
  page?: number;
  page_size?: number;
};

export type PaginatedCompanies = {
  items: Company[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

// FIX: was returning res.data directly (Company[]), but /companies returns a paginated object
export async function fetchCompanies(
  filter?: CompanyFilter
): Promise<PaginatedCompanies> {
  const res = await api.get("/companies", { params: filter });
  return res.data;
}

// ── Categories ───────────────────────────────────────────────────────────────

export const fetchCategories = async (): Promise<Category[]> => {
  const res = await api.get("/categories");
  return res.data;
};

// ── Item helpers ─────────────────────────────────────────────────────────────

export const setItemActive = (id: number, active: boolean) =>
  api.patch(`/items/${id}/active`, { is_active: active });

// ── Company logo helpers ──────────────────────────────────────────────────────

export const uploadCompanyLogo = async (companyId: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/companies/${companyId}/logo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteCompanyLogo = async (companyId: number) => {
  return api.delete(`/companies/${companyId}/logo`);
};
