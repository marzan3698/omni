// Example service - demonstrates business logic layer
// Remove this when implementing real services

export const exampleService = {
  getExampleData: async () => {
    // Business logic goes here
    return {
      message: 'This is an example service',
      timestamp: new Date().toISOString(),
    };
  },
};

