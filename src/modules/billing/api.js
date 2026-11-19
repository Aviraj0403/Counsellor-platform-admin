import Axios from '../../shared/api/Axios';

// Platform finance: plans, pricing, invoices, costs, financial dashboard
export const dashboard = (month) => Axios.get('/platform/dashboard', { params: { month } });

export const listPlans = () => Axios.get('/platform/plans');
export const createPlan = (body) => Axios.post('/platform/plans', body);
export const updatePlan = (id, body) => Axios.patch(`/platform/plans/${id}`, body);

export const tenantBilling = (id) => Axios.get(`/platform/tenants/${id}/billing`);
export const assignPlan = (id, planKey) => Axios.patch(`/platform/tenants/${id}/plan`, { planKey });
export const setPricing = (id, priceOverrides) => Axios.patch(`/platform/tenants/${id}/pricing`, { priceOverrides });
export const generateInvoice = (id, period) => Axios.post(`/platform/tenants/${id}/invoices`, { period });

export const listInvoices = (params) => Axios.get('/platform/invoices', { params });
export const setInvoiceStatus = (id, status, paidRef) => Axios.patch(`/platform/invoices/${id}`, { status, paidRef });

export const listCosts = (month) => Axios.get('/platform/costs', { params: { month } });
export const addCost = (body) => Axios.post('/platform/costs', body);
export const voidCost = (id) => Axios.post(`/platform/costs/${id}/void`);

// Organisation names for pickers (for example "which organisation caused this cost"). Plain HTTP call, not a module dependency.
export const listOrganisations = (params) => Axios.get('/platform/tenants', { params });

// Company details printed on invoices, organisation billing details, invoice PDF and payment links
export const getSettings = () => Axios.get('/platform/settings');
export const saveSettings = (body) => Axios.put('/platform/settings', body);
export const saveBillingDetails = (id, body) => Axios.patch(`/platform/tenants/${id}/billing-details`, body);
export const invoicePdf = (id) => Axios.get(`/platform/invoices/${id}/pdf`, { responseType: 'blob' });
export const createPaymentLink = (id) => Axios.post(`/platform/invoices/${id}/payment-link`);
