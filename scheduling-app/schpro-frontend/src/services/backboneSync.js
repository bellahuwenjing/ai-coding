import Backbone from 'backbone';
import api from './api';

/**
 * Override Backbone.sync to use our API service (with mock support)
 *
 * This allows Backbone models and collections to work with our
 * API service that includes authentication and mock data.
 */

Backbone.sync = function(method, model, options = {}) {
  // Map Backbone methods to HTTP methods
  const methodMap = {
    create: 'post',
    read: 'get',
    update: 'put',
    patch: 'put', // We use PUT for patch as well
    delete: 'delete'
  };

  const httpMethod = methodMap[method];

  // Get URL from model or options
  const url = options.url || (typeof model.url === 'function' ? model.url() : model.url);

  if (!url) {
    throw new Error('A "url" property or function must be specified');
  }

  // Prepare request config
  const config = {
    method: httpMethod,
    url: url,
    ...options
  };

  // Prepare data for create/update/patch
  let data = null;
  if (method === 'create' || method === 'update' || method === 'patch') {
    data = options.data || model.toJSON(options);
  }

  // Make API request using the appropriate method
  let promise;
  if (httpMethod === 'get') {
    promise = api.get(url, config);
  } else if (httpMethod === 'post') {
    promise = api.post(url, data, config);
  } else if (httpMethod === 'put') {
    promise = api.put(url, data, config);
  } else if (httpMethod === 'delete') {
    promise = api.delete(url, config);
  } else {
    return Promise.reject(new Error(`Unknown HTTP method: ${httpMethod}`));
  }

  // Handle response
  return promise
    .then((response) => {
      // Call Backbone success callback
      if (options.success) {
        options.success(response.data);
      }
      // Trigger sync event
      model.trigger && model.trigger('sync', model, response.data, options);
      return response.data;
    })
    .catch((error) => {
      // Call Backbone error callback
      if (options.error) {
        options.error(error);
      }
      // Trigger error event
      model.trigger && model.trigger('error', model, error, options);
      throw error;
    });
};

export default Backbone.sync;
