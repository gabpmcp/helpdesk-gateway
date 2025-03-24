/**
 * Pure function to verify a user in Zoho CRM and register them as a client
 * 
 * @param fetchZohoUser - Curried function to check if user exists in Zoho
 * @param registerClient - Curried function to register the client in our system
 * @returns A function that takes email and password and returns a Promise
 */
export const verifyAndRegisterUser = (
  fetchZohoUser: (email: string, password: string) => Promise<any>,
  registerClient: (user: any) => Promise<any>
) => (email: string, password: string): Promise<any> =>
  fetchZohoUser(email, password)
    .then(userExists => 
      userExists
        ? registerClient(userExists)
        : Promise.reject({ message: 'User not found in Zoho CRM' })
    );
