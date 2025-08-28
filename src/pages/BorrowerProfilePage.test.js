
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import BorrowerProfilePage from './BorrowerProfilePage';
import { useFirestore } from '../contexts/FirestoreProvider';

// Mock the necessary modules
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: 'borrower-1' }),
}));
jest.mock('../contexts/FirestoreProvider');

// Mock the useSnackbar hook
jest.mock('../components/SnackbarProvider', () => ({
  useSnackbar: () => jest.fn(),
}));

const mockBorrower = {
  id: 'borrower-1',
  name: 'Test Borrower',
  phone: '123-456-7890',
  email: 'test@example.com',
};

const mockGuarantors = [
  { id: 'guarantor-1', name: 'Guarantor 1', phone: '111-111-1111', borrowerId: 'borrower-1' },
];

const mockComments = [
  { id: 'comment-1', text: 'This is a comment', borrowerId: 'borrower-1', createdAt: { toDate: () => new Date() } },
];

describe('BorrowerProfilePage', () => {
  const mockDeleteGuarantor = jest.fn();
  const mockDeleteComment = jest.fn();

  beforeEach(() => {
    useFirestore.mockReturnValue({
      borrowers: [mockBorrower],
      loans: [],
      comments: mockComments,
      guarantors: mockGuarantors,
      loading: false,
      deleteGuarantor: mockDeleteGuarantor,
      deleteComment: mockDeleteComment,
    });
  });

  it('calls deleteGuarantor when the delete button is clicked', () => {
    render(<BorrowerProfilePage />);

    const guarantorListItem = screen.getByText('Guarantor 1').closest('li');
    const deleteButton = within(guarantorListItem).getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Find the confirm button in the dialog and click it
    const confirmButton = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(confirmButton);

    expect(mockDeleteGuarantor).toHaveBeenCalledWith('guarantor-1');
  });

  it('calls deleteComment when the delete button is clicked', () => {
    render(<BorrowerProfilePage />);

    const commentListItem = screen.getByText('This is a comment').closest('li');
    const deleteButton = within(commentListItem).getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(mockDeleteComment).toHaveBeenCalledWith('comment-1');
  });
});
