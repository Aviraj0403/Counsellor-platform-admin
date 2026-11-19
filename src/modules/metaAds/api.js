import Axios from '../../shared/api/Axios';

export const getConfig = () => Axios.get('/integrations/meta/config');
export const saveConfig = (body) => Axios.put('/integrations/meta/config', body);
export const sendTest = () => Axios.post('/integrations/meta/test');
export const listEvents = () => Axios.get('/integrations/meta/events');
