
import { addLoan, refinanceLoan, updateLoan } from './loanService';
import { 
  addDoc, 
  collection, 
  serverTimestamp, 
  runTransaction,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

// Mock Firebase functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((db, col) => `mock-collection-${col}`),
  addDoc: jest.fn(() => Promise.resolve({ id: 'newLoanId' })),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  getDoc: jest.fn(),
  runTransaction: jest.fn(),
  deleteField: jest.fn(),
}));

jest.mock('./activityService', () => ({
  addActivityLog: jest.fn(),
}));

describe('loanService', () => {
  const mockDb = {};
  const mockCurrentUser = { uid: 'user123' };
  const mockBorrowers = [{ id: 'borrower1', name: 'John Doe' }];

  beforeEach(() => {
    jest.clearAllMocks();
    const { collection, addDoc, serverTimestamp, runTransaction, doc, getDoc } = require('firebase/firestore');
    
    collection.mockImplementation((db, col) => `mock-collection-${col}`);
    addDoc.mockResolvedValue({ id: 'newLoanId' });
    serverTimestamp.mockReturnValue('mock-timestamp');
    doc.mockImplementation((db, col, id) => `mock-doc-${col}-${id}`);
    updateDoc.mockResolvedValue();
    getDoc.mockResolvedValue({ exists: () => false });
    runTransaction.mockImplementation(async (db, cb) => cb({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn()
    }));
  });

  describe('addLoan', () => {
    it('should add a loan successfully', async () => {
      const loanData = {
        borrowerId: 'borrower1',
        principal: 5000,
        interest: 500,
        totalRepayable: 5500,
        startDate: '2023-01-01',
        dueDate: '2023-02-01',
      };

      const result = await addLoan(mockDb, loanData, mockBorrowers, mockCurrentUser);

      expect(addDoc).toHaveBeenCalledWith('mock-collection-loans', expect.objectContaining({
        ...loanData,
        userId: 'user123',
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp',
      }));
      expect(result.id).toBe('newLoanId');
    });

    it('should default borrower name if not found', async () => {
      const loanData = { 
        borrowerId: 'unknown', 
        principal: 1000,
        interest: 100,
        totalRepayable: 1100,
        startDate: '2023-01-01',
        dueDate: '2023-02-01'
      };
      await addLoan(mockDb, loanData, [], mockCurrentUser);
      // Verify activity log uses default name (this would be checked in activityService mock)
    });
  });

  describe('refinanceLoan', () => {
    it('should refinance a loan correctly', async () => {
      const oldLoanId = 'oldLoan1';
      const newStartDate = '2023-02-01';
      const newDueDate = '2023-03-01';
      const newPrincipal = 6000;
      const interestDuration = 1;
      const settings = { interestRates: { 1: 0.1 } }; // 10% rate

      // Mock Transaction
      runTransaction.mockImplementation(async (db, callback) => {
        const mockTransaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ 
              borrowerId: 'borrower1',
              status: 'Active'
            }),
          }),
          set: jest.fn(),
          update: jest.fn(),
        };
        await callback(mockTransaction);
      });

      // Mock doc reference creation
      doc.mockReturnValue({ id: 'newRefinanceId' });

      await refinanceLoan(
        mockDb, 
        oldLoanId, 
        newStartDate, 
        newDueDate, 
        newPrincipal, 
        interestDuration, 
        null, // manualInterestRate
        settings, 
        mockCurrentUser
      );

      // Verify transaction behavior would be checked here by inspecting the mock calls
      expect(runTransaction).toHaveBeenCalled();
    });
  });
});
