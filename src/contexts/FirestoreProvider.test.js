import React from 'react';
import { render, act } from '@testing-library/react';
import { FirestoreProvider, useFirestore } from './FirestoreProvider';
import { useAuth } from './AuthProvider';

// Mock the necessary modules
jest.mock('./AuthProvider');
jest.mock('firebase/firestore', () => {
  const originalModule = jest.requireActual('firebase/firestore');
  return {
    ...originalModule,
    getFirestore: jest.fn(),
    enableIndexedDbPersistence: jest.fn(() => Promise.resolve()),
    doc: jest.fn(),
    deleteDoc: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    orderBy: jest.fn(),
    onSnapshot: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    where: jest.fn(),
    serverTimestamp: jest.fn(),
  };
});

jest.mock('../firebase', () => ({
  db: 'mock-db',
}));

jest.mock('../components/SnackbarProvider', () => ({
  useSnackbar: () => jest.fn(),
}));

jest.mock('../hooks/useOfflineStatus', () => () => true);

const mockCurrentUser = { uid: 'test-user-id', displayName: 'Test User', email: 'test@example.com' };

describe('FirestoreProvider delete functions', () => {
  const { doc, deleteDoc, db } = require('firebase/firestore');

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: mockCurrentUser });
  });

  it('should call deleteDoc for deleteBorrower', async () => {
    let firestoreContext;
    const TestComponent = () => {
      firestoreContext = useFirestore();
      return null;
    };

    render(
      <FirestoreProvider>
        <TestComponent />
      </FirestoreProvider>
    );

    await act(async () => {
      await firestoreContext.deleteBorrower('borrower-id');
    });

    expect(doc).toHaveBeenCalledWith(db, 'borrowers', 'borrower-id');
    expect(deleteDoc).toHaveBeenCalledWith(doc(db, 'borrowers', 'borrower-id'));
  });

  it('should call deleteDoc for deleteGuarantor', async () => {
    let firestoreContext;
    const TestComponent = () => {
      firestoreContext = useFirestore();
      return null;
    };

    render(
      <FirestoreProvider>
        <TestComponent />
      </FirestoreProvider>
    );

    await act(async () => {
      await firestoreContext.deleteGuarantor('guarantor-id');
    });

    expect(doc).toHaveBeenCalledWith(db, 'guarantors', 'guarantor-id');
    expect(deleteDoc).toHaveBeenCalledWith(doc(db, 'guarantors', 'guarantor-id'));
  });

  it('should call deleteDoc for deleteComment', async () => {
    let firestoreContext;
    const TestComponent = () => {
      firestoreContext = useFirestore();
      return null;
    };

    render(
      <FirestoreProvider>
        <TestComponent />
      </FirestoreProvider>
    );

    await act(async () => {
      await firestoreContext.deleteComment('comment-id');
    });

    expect(doc).toHaveBeenCalledWith(db, 'comments', 'comment-id');
    expect(deleteDoc).toHaveBeenCalledWith(doc(db, 'comments', 'comment-id'));
  });
});