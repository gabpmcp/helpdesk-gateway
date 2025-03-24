import { Map } from 'immutable';
import { authTransition } from './zohoLogic';

// Mock functions
const mockVerifyZohoUser = jest.fn();
const mockStoreEvent = jest.fn();

describe('authTransition', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockVerifyZohoUser.mockReset();
    mockStoreEvent.mockReset();
  });

  it('should generate AUTH_SUCCESS event when user exists', async () => {
    // Arrange
    const email = 'user@example.com';
    const password = 'password123';
    const userData = { email, isValidUser: true, token: 'mock-token' };
    
    mockVerifyZohoUser.mockResolvedValue(userData);
    mockStoreEvent.mockResolvedValue({ success: true });
    
    const transition = authTransition(mockVerifyZohoUser, mockStoreEvent);
    
    // Act
    const result = await transition({ email, password });
    
    // Assert
    expect(mockVerifyZohoUser).toHaveBeenCalledWith(email, password);
    expect(mockStoreEvent).toHaveBeenCalled();
    expect(mockStoreEvent.mock.calls[0][0]).toBe(email);
    expect(mockStoreEvent.mock.calls[0][1]).toHaveProperty('type', 'AUTHENTICATE_USER');
    expect(mockStoreEvent.mock.calls[0][2]).toHaveProperty('type', 'AUTH_SUCCESS');
    expect(result).toHaveProperty('type', 'AUTH_SUCCESS');
    expect(result).toHaveProperty('user_id', email);
    expect(result).toHaveProperty('user_data', userData);
  });

  it('should generate AUTH_FAILED event when user does not exist', async () => {
    // Arrange
    const email = 'nonexistent@example.com';
    const password = 'wrong-password';
    
    mockVerifyZohoUser.mockResolvedValue(null);
    mockStoreEvent.mockResolvedValue({ success: true });
    
    const transition = authTransition(mockVerifyZohoUser, mockStoreEvent);
    
    // Act & Assert
    await expect(transition({ email, password })).rejects.toHaveProperty('type', 'AUTH_FAILED');
    
    expect(mockVerifyZohoUser).toHaveBeenCalledWith(email, password);
    expect(mockStoreEvent).toHaveBeenCalled();
    expect(mockStoreEvent.mock.calls[0][0]).toBe(email);
    expect(mockStoreEvent.mock.calls[0][1]).toHaveProperty('type', 'AUTHENTICATE_USER');
    expect(mockStoreEvent.mock.calls[0][2]).toHaveProperty('type', 'AUTH_FAILED');
  });

  it('should handle errors from verifyZohoUser', async () => {
    // Arrange
    const email = 'user@example.com';
    const password = 'password123';
    const error = new Error('API error');
    
    mockVerifyZohoUser.mockRejectedValue(error);
    
    const transition = authTransition(mockVerifyZohoUser, mockStoreEvent);
    
    // Act & Assert
    await expect(transition({ email, password })).rejects.toEqual(error);
    
    expect(mockVerifyZohoUser).toHaveBeenCalledWith(email, password);
    expect(mockStoreEvent).not.toHaveBeenCalled();
  });

  it('should handle errors from storeEvent', async () => {
    // Arrange
    const email = 'user@example.com';
    const password = 'password123';
    const userData = { email, isValidUser: true, token: 'mock-token' };
    const error = new Error('Database error');
    
    mockVerifyZohoUser.mockResolvedValue(userData);
    mockStoreEvent.mockRejectedValue(error);
    
    const transition = authTransition(mockVerifyZohoUser, mockStoreEvent);
    
    // Act & Assert
    await expect(transition({ email, password })).rejects.toEqual(error);
    
    expect(mockVerifyZohoUser).toHaveBeenCalledWith(email, password);
    expect(mockStoreEvent).toHaveBeenCalled();
  });
});
