/**
 * "Acting as an organisation" state for platform staff (the counterpart of the ecommerce admin's active-store session).
 * Kept in sessionStorage so it dies with the tab and never leaks into another tab or a later session.
 * While an id is stored, every API call carries `x-acting-tenant: <id>` (see shared/api/Axios.js).
 * Only the id and a display name are kept; the real organisation data always comes from GET /me.
 */
const ID = 'cp_acting_tenant_id';
const NAME = 'cp_acting_tenant_name';
const STATUS = 'cp_acting_tenant_status';

export const getActingTenantId = () => {
  try {
    return sessionStorage.getItem(ID) || '';
  } catch {
    return '';
  }
};

export const getActingTenantName = () => {
  try {
    return sessionStorage.getItem(NAME) || '';
  } catch {
    return '';
  }
};

export const getActingTenantStatus = () => {
  try {
    return sessionStorage.getItem(STATUS) || '';
  } catch {
    return '';
  }
};

export const setActingTenant = (id, name = '', status = '') => {
  try {
    sessionStorage.setItem(ID, String(id));
    if (name) sessionStorage.setItem(NAME, name);
    else sessionStorage.removeItem(NAME);
    if (status) sessionStorage.setItem(STATUS, status);
    else sessionStorage.removeItem(STATUS);
  } catch {
    /* storage blocked: acting simply will not survive a reload */
  }
};

export const clearActingTenant = () => {
  try {
    sessionStorage.removeItem(ID);
    sessionStorage.removeItem(NAME);
    sessionStorage.removeItem(STATUS);
  } catch {
    /* nothing to clear */
  }
};
