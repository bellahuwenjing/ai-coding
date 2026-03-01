const { supabaseAdmin } = require('./supabase.service');

/**
 * Track an analytics event.
 * Fire-and-forget — never blocks the request, never throws.
 *
 * @param {string} event_name  - e.g. 'booking.created'
 * @param {string} company_id  - UUID from req.user.company_id
 * @param {object} metadata    - optional extra data
 */
function track(event_name, company_id, metadata = {}) {
  supabaseAdmin
    .from('analytics_events')
    .insert({ event_name, company_id, metadata })
    .then(() => {})
    .catch(() => {});
}

module.exports = { track };
