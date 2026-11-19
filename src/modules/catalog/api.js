import Axios from '../../shared/api/Axios';

// Plain-language module and role lists. Every screen renders from these, nothing is hard-coded in the UI.
export const modules = () => Axios.get('/catalog/modules');
export const roles = () => Axios.get('/catalog/roles');
