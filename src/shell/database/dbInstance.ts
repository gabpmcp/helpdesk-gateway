/**
 * Mock database instance for demonstration purposes
 * In a real application, this would be a connection to a real database
 */
export const db = {
  insertClient: (user: any): Promise<any> => {
    console.log('Inserting client into database:', user);
    return Promise.resolve({
      id: `client_${Date.now()}`,
      ...user,
      createdAt: new Date().toISOString()
    });
  },
  
  findClientByEmail: (email: string): Promise<any> => {
    console.log('Finding client by email:', email);
    return Promise.resolve(null); // Simulating no client found
  }
};
