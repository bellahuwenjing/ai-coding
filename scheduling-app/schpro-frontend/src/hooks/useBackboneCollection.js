import { useState, useEffect } from 'react';

/**
 * React hook to integrate Backbone collections with React components
 *
 * @param {Backbone.Collection} collection - Backbone collection instance
 * @returns {Object} - { models, isFetching, error, fetch, add, remove }
 */
export function useBackboneCollection(collection) {
  const [models, setModels] = useState([...collection.models]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen to collection changes
    const handleUpdate = () => {
      setModels([...collection.models]);
    };

    const handleSync = () => {
      setIsFetching(false);
      setError(null);
      setModels([...collection.models]);
    };

    const handleError = (collection, err) => {
      setIsFetching(false);
      setError(err);
    };

    const handleRequest = () => {
      setIsFetching(true);
      setError(null);
    };

    // Attach listeners
    collection.on('add remove reset change sort', handleUpdate);
    collection.on('sync', handleSync);
    collection.on('error', handleError);
    collection.on('request', handleRequest);

    // Cleanup on unmount
    return () => {
      collection.off('add remove reset change sort', handleUpdate);
      collection.off('sync', handleSync);
      collection.off('error', handleError);
      collection.off('request', handleRequest);
    };
  }, [collection]);

  // Wrapper methods
  const fetch = (options) => {
    return collection.fetch(options);
  };

  const add = (models, options) => {
    return collection.add(models, options);
  };

  const remove = (models, options) => {
    return collection.remove(models, options);
  };

  return {
    models,
    isFetching,
    error,
    fetch,
    add,
    remove,
  };
}

export default useBackboneCollection;
