import applications from '../modules/applications/module';
import audit from '../modules/audit/module';
import auth from '../modules/auth/module';
import billing from '../modules/billing/module';
import colleges from '../modules/colleges/module';
import commissions from '../modules/commissions/module';
import dashboard from '../modules/dashboard/module';
import documents from '../modules/documents/module';
import insights from '../modules/insights/module';
import followups from '../modules/followups/module';
import leads from '../modules/leads/module';
import metaAds from '../modules/metaAds/module';
import portal from '../modules/portal/module';
import publicApi from '../modules/publicApi/module';
import ledger from '../modules/ledger/module';
import organisations from '../modules/organisations/module';
import reports from '../modules/reports/module';
import seoPages from '../modules/seoPages/module';
import students from '../modules/students/module';
import team from '../modules/team/module';
import whatsapp from '../modules/whatsapp/module';

/**
 * THE list of feature modules. Adding a feature = create src/modules/<name>/ (api.js, pages/, module.jsx, optional index.js)
 * and add ONE line here. Routes and the sidebar are built from this list; nothing else needs editing.
 * (The catalog module has no screens of its own, it only exposes a hook, so it is not listed.)
 */
export const MODULES = [dashboard, organisations, billing, insights, audit, leads, followups, ledger, students, colleges, applications, documents, commissions, reports, metaAds, portal, publicApi, seoPages, team, whatsapp, auth];
