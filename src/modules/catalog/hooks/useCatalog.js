import { useEffect, useState } from 'react';
import * as catalogApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';

// The catalogue is the same for everyone and rarely changes: fetched once per page load, then shared.
let cache = null;

/** { modules: [...], roles: [...] } from the API, or null while loading. */
export default function useCatalog() {
  const [data, setData] = useState(cache);
  useEffect(() => {
    if (cache) return undefined;
    let live = true;
    Promise.all([catalogApi.modules(), catalogApi.roles()])
      .then(([m, r]) => {
        cache = { modules: m.data.modules, roles: r.data.roles };
        if (live) setData(cache);
      })
      .catch(toastError);
    return () => {
      live = false;
    };
  }, []);
  return data;
}
