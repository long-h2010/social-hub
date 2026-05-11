import { api } from '@/lib/api/axios';
import { transformKeysToCamelCase } from '@/lib/utils';
import { DataProvider, LogicalFilter } from '@refinedev/core';
import { AxiosInstance } from 'axios';
import { stringify } from 'query-string';

const axiosInstance: AxiosInstance = api;

export const dataProvider = (
  apiUrl: string,
  httpClient: AxiosInstance = axiosInstance,
): DataProvider => ({
  getList: async ({
    resource,
    pagination,
    filters = [],
    sorters = [],
    meta,
  }) => {
    const { currentPage = 1, pageSize = 10 } = pagination ?? {};

    const queryParams: Record<string, any> = {
      page: currentPage,
      limit: pageSize,
    };

    filters.forEach((item) => {
      if ('operator' in item && item.operator === 'or') {
        const orFilters = item.value as LogicalFilter[];
        const keyword = orFilters[0]?.value;
        const fields = orFilters
          .filter((f) => 'field' in f && f.operator === 'contains')
          .map((f) => (f as LogicalFilter).field);

        if (keyword !== undefined) queryParams['search'] = keyword;
        if (fields.length) queryParams['searchFields'] = fields.join(',');
        return;
      }

      if ('field' in item && item.operator && item.value !== undefined) {
        const { field, operator, value } = item;

        if (operator == 'eq') queryParams[field] = value;
        else if (operator == 'contains') queryParams[`${field}_like`] = value;
        else if (operator == 'in')
          queryParams[`${field}_in`] = Array.isArray(value)
            ? value.join(',')
            : value;
        else queryParams[field] = value;
      }
    });

    if (sorters.length > 0) {
      const sortArray: string[] = [];

      sorters.forEach((sorter) => {
        const prefix = sorter.order === 'desc' ? '-' : '';
        sortArray.push(`${prefix}${sorter.field}`);
      });

      queryParams.sort = sortArray.join(',');
    }

    const url = `/${resource}?${stringify(queryParams)}`;

    const { data } = await httpClient.get(url, {
      headers: meta?.headers,
    });

    const transformData = transformKeysToCamelCase(data);

    return {
      data: transformData.founds ?? transformData,
      total: transformData.total ?? transformData.length ?? 0,
    };
  },

  getOne: async ({ resource, id, meta }) => {
    const { data } = await httpClient.get(`${apiUrl}/${resource}/${id}`, {
      headers: meta?.headers,
    });

    const transformData = transformKeysToCamelCase(data);

    return { data: transformData.data || transformData };
  },

  create: async ({ resource, variables, meta }) => {
    const { data } = await httpClient.post(`${apiUrl}/${resource}`, variables, {
      headers: meta?.headers,
    });
    return { data: data.data || data };
  },

  update: async ({ resource, id, variables, meta }) => {
    const { data } = await httpClient.put(
      `${apiUrl}/${resource}/${id}`,
      variables,
      { headers: meta?.headers },
    );
    return { data: data.data || data };
  },

  deleteOne: async ({ resource, id, meta }) => {
    const { data } = await httpClient.delete(`${apiUrl}/${resource}/${id}`, {
      headers: meta?.headers,
    });
    return { data: data.data || data };
  },

  custom: async ({ url, method, payload, query, headers, meta }) => {
    const requestUrl = url.startsWith('http') ? url : `${apiUrl}/${url}`;

    const { data } = await axiosInstance({
      url: requestUrl,
      method: method || 'get',
      data: payload,
      params: query,
      headers: {
        ...headers,
        ...(meta?.headers || {}),
      },
    });

    return { data };
  },

  getApiUrl: () => apiUrl,
});
