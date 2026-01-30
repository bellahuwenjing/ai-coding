import { useState, useEffect } from 'react';

/**
 * React hook to integrate Backbone models with React components
 *
 * @param {Backbone.Model} model - Backbone model instance
 * @returns {Object} - { attributes, isSyncing, error, save, destroy, fetch }
 */
export function useBackboneModel(model) {
  const [attributes, setAttributes] = useState(model.toJSON());
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen to model changes
    const handleChange = () => {
      setAttributes(model.toJSON());
    };

    const handleSync = () => {
      setIsSyncing(false);
      setError(null);
      setAttributes(model.toJSON());
    };

    const handleError = (model, err) => {
      setIsSyncing(false);
      setError(err);
    };

    const handleRequest = () => {
      setIsSyncing(true);
      setError(null);
    };

    // Attach listeners
    model.on('change', handleChange);
    model.on('sync', handleSync);
    model.on('error', handleError);
    model.on('request', handleRequest);

    // Cleanup on unmount
    return () => {
      model.off('change', handleChange);
      model.off('sync', handleSync);
      model.off('error', handleError);
      model.off('request', handleRequest);
    };
  }, [model]);

  // Wrapper methods
  const save = (attrs, options) => {
    return model.save(attrs, options);
  };

  const destroy = (options) => {
    return model.destroy(options);
  };

  const fetch = (options) => {
    return model.fetch(options);
  };

  return {
    attributes,
    isSyncing,
    error,
    save,
    destroy,
    fetch,
  };
}

export default useBackboneModel;
